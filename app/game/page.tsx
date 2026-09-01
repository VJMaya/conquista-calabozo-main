'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import BattleArena from '@/components/game/BattleArena';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import {
  BattleAnimationQueue,
  buildAnimKey,
  createBattleAnimEvent,
} from '@/lib/battle-animation';
import type { BattleAnimEvent, BattleMember } from '@/types/battle';
import { LeaderboardEntry, Player, Question } from '@/types/game';
import { TOTAL_QUESTIONS, TOTAL_STAGES } from '@/data/pack';

interface PublicQuestion extends Question {
  questionNumber?: number;
  totalQuestions?: number;
  stageTitle?: string;
  stageDescription?: string;
  stageNumber?: number;
  visualTheme?: string;
  timeLimitSeconds: number;
}

interface TeamMember extends Player {
  answeredCount?: number;
  correctCount?: number;
}

interface TeamState {
  id?: string;
  teamId?: string;
  name?: string;
  teamName?: string;
  members: TeamMember[];
  totalCorrect?: number;
  totalTimeSeconds?: number;
  finalScore?: number;
  completed?: boolean;
  currentStage?: number;
  currentQuestionIndex?: number;
}

interface AnswerFeedback {
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: string;
  userAnswer?: string;
}

function resolveTeamId(team: TeamState | null) {
  return team?.id || team?.teamId || '';
}

function resolveTeamName(team: TeamState | null) {
  return team?.name || team?.teamName || 'Unassigned team';
}

function toBattleMembers(members: TeamMember[] | undefined): BattleMember[] {
  return (members || []).slice(0, 5).map((member) => ({
    id: member.id,
    displayName: member.displayName,
    avatarKey: member.avatarKey,
    isConnected: member.isConnected !== false,
    answeredCount: member.answeredCount || 0,
    correctCount: member.correctCount || 0,
  }));
}

function patchMemberStats(
  members: TeamMember[],
  memberId: string,
  nextAnsweredCount: number,
  nextCorrectCount: number
): TeamMember[] {
  return members.map((member) =>
    member.id === memberId
      ? { ...member, answeredCount: nextAnsweredCount, correctCount: nextCorrectCount }
      : member
  );
}

export default function GamePage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef('');
  const questionIdRef = useRef('');
  const queueRef = useRef<BattleAnimationQueue | null>(null);

  const [userId, setUserId] = useState('');
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [team, setTeam] = useState<TeamState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [waitingForTeam, setWaitingForTeam] = useState(false);
  const [teamFinished, setTeamFinished] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [activeAnim, setActiveAnim] = useState<BattleAnimEvent | null>(null);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    questionIdRef.current = question?.id || '';
  }, [question?.id]);

  useEffect(() => {
    const queue = new BattleAnimationQueue();
    queueRef.current = queue;
    const unsubscribe = queue.subscribe((event) => {
      setActiveAnim(event);
    });
    return () => {
      unsubscribe();
      queue.dispose();
      queueRef.current = null;
    };
  }, []);

  useEffect(() => {
    const displayName = localStorage.getItem('displayName');
    const avatarKey = localStorage.getItem('avatarKey');
    const storedUserId = localStorage.getItem('userId');

    if (!storedUserId || !displayName || !avatarKey) {
      router.push('/');
      return undefined;
    }

    setUserId(storedUserId);
    userIdRef.current = storedUserId;

    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('player:join_lobby', {
        userId: storedUserId,
        displayName,
        avatarKey,
      });
      socket.emit('leaderboard:request');
    });

    socket.on('player:profile', (data: { userId?: string }) => {
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
        setUserId(data.userId);
        userIdRef.current = data.userId;
      }
    });

    socket.on('game:started', () => {
      setTeamFinished(false);
    });

    socket.on('team:assigned', (data: TeamState) => {
      setTeam(data);
      setMemberCount(data.members?.length || 0);
      if (data.completed) {
        setTeamFinished(true);
      }
    });

    socket.on('question:show', (data: PublicQuestion) => {
      const limit = data.timeLimitSeconds || 30;
      setQuestion({
        ...data,
        timeLimitSeconds: limit,
        questionType: data.questionType || 'multiple_choice',
      });
      setRemainingSeconds(limit);
      setAnswered(false);
      setWaitingForTeam(false);
      setTeamFinished(false);
      setFeedback(null);
      setAnsweredCount(0);
    });

    socket.on('answer:result', (data: {
      isCorrect: boolean;
      pointsAwarded: number;
      correctAnswer: string;
      userAnswer?: string;
      answeredCount?: number;
      correctCount?: number;
    }) => {
      const currentUserId = userIdRef.current;
      setAnswered(true);
      setWaitingForTeam(true);
      setFeedback({
        isCorrect: data.isCorrect,
        pointsAwarded: data.pointsAwarded,
        correctAnswer: data.correctAnswer,
        userAnswer: data.userAnswer,
      });

      if (typeof data.answeredCount === 'number' && typeof data.correctCount === 'number') {
        setTeam((current) =>
          current
            ? {
                ...current,
                members: patchMemberStats(
                  current.members,
                  currentUserId,
                  data.answeredCount as number,
                  data.correctCount as number
                ),
              }
            : current
        );
      }

      queueRef.current?.enqueue(
        createBattleAnimEvent({
          key: buildAnimKey(currentUserId, questionIdRef.current || 'q', 'result'),
          userId: currentUserId,
          avatarKey: avatarKey || 'knight',
          isCorrect: data.isCorrect,
          pointsAwarded: data.pointsAwarded,
          kind: data.isCorrect ? 'success' : 'miss',
          questionId: questionIdRef.current,
        })
      );
    });

    socket.on('team:member_answered', (data: {
      userId: string;
      avatarKey?: string;
      isCorrect: boolean;
      pointsAwarded: number;
      answeredCount: number;
      correctCount: number;
    }) => {
      setTeam((current) =>
        current
          ? {
              ...current,
              members: patchMemberStats(
                current.members,
                data.userId,
                data.answeredCount,
                data.correctCount
              ),
            }
          : current
      );

      if (data.userId === userIdRef.current) {
        return;
      }

      queueRef.current?.enqueue(
        createBattleAnimEvent({
          key: buildAnimKey(data.userId, questionIdRef.current || 'q', 'team'),
          userId: data.userId,
          avatarKey: data.avatarKey || 'knight',
          isCorrect: data.isCorrect,
          pointsAwarded: data.pointsAwarded,
          kind: data.isCorrect ? 'success' : 'miss',
          questionId: questionIdRef.current,
        })
      );
    });

    socket.on('team:answer_status', (data: { answeredCount?: number; memberCount?: number }) => {
      setAnsweredCount(data.answeredCount || 0);
      setMemberCount(data.memberCount || 0);
    });

    socket.on('question:completed', (data: { totalCorrect?: number }) => {
      setWaitingForTeam(false);
      setTeam((current) =>
        current
          ? { ...current, totalCorrect: data.totalCorrect ?? current.totalCorrect }
          : current
      );
    });

    socket.on('team:finished', () => {
      setTeamFinished(true);
      setQuestion(null);
      setWaitingForTeam(false);
      setAnswered(true);
    });

    socket.on('leaderboard:update', (data: { entries?: LeaderboardEntry[] }) => {
      setLeaderboard(data.entries || []);
    });

    socket.on('leaderboard:show', (data: { entries?: LeaderboardEntry[] }) => {
      setLeaderboard(data.entries || []);
      setShowLeaderboard(true);
    });

    socket.on('game:ended', (data: { results?: unknown }) => {
      localStorage.setItem('finalResults', JSON.stringify(data.results || data));
      router.push('/final');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  useEffect(() => {
    if (!question || answered || teamFinished) return undefined;

    const interval = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [question?.id, answered, teamFinished, question]);

  const submitAnswer = (answer: string) => {
    const socket = socketRef.current;
    if (!socket || !question || answered || teamFinished) return;
    socket.emit('player:submit_answer', {
      questionId: question.id,
      answer,
      timeUsedSeconds: Math.max(0, question.timeLimitSeconds - remainingSeconds),
    });
  };

  const teamId = resolveTeamId(team);
  const teamName = resolveTeamName(team);
  const ownStanding = leaderboard.find((entry) => entry.teamId === teamId);
  const questionNumber = question?.questionNumber || 1;
  const totalQuestions = question?.totalQuestions ?? TOTAL_QUESTIONS;
  const stageNumber = question?.stageNumber || team?.currentStage || 1;
  const battleMembers = useMemo(() => toBattleMembers(team?.members), [team?.members]);

  const teamTotalCorrect = team?.totalCorrect ?? ownStanding?.totalCorrect ?? 0;
  const teamMemberCount = Math.max(1, battleMembers.length);
  const maximumTeamCorrect = teamMemberCount * TOTAL_QUESTIONS;
  const bossHealthPercent = Math.max(
    0,
    Math.min(100, 100 - (teamTotalCorrect / maximumTeamCorrect) * 100)
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0e27]">
        <div className="sr-only" aria-live="polite">
          {answeredCount} of {memberCount} members answered
        </div>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 opacity-70 transition-opacity hover:opacity-100 focus-within:opacity-100">
          <p className="dungeon-title text-sm sm:text-base">Conquest of the Dungeon</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => router.push('/ranking')}
            >
              Ranking
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setShowLeaderboard((value) => !value)}
            >
              {showLeaderboard ? 'Hide board' : 'Leaderboard'}
            </Button>
          </div>
        </div>

        <BattleArena
          currentUserId={userId}
          teamName={teamName}
          members={battleMembers}
          question={question}
          remainingSeconds={remainingSeconds}
          answered={answered}
          waitingForTeammates={waitingForTeam}
          teamFinished={teamFinished}
          currentRank={ownStanding?.rank}
          stageNumber={stageNumber}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          totalStages={TOTAL_STAGES}
          feedback={feedback}
          activeAnim={activeAnim}
          bossHealthPercent={bossHealthPercent}
          onSubmit={submitAnswer}
          onOpenRanking={() => router.push('/ranking')}
        />

        {showLeaderboard && (
          <div className="mx-auto max-w-6xl px-3 pb-6">
            <LeaderboardPanel entries={leaderboard} currentUserTeamId={teamId} />
          </div>
        )}
      </div>
    </Layout>
  );
}
