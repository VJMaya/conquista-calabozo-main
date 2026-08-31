'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import TimerBar from '@/components/ui/TimerBar';
import QuestionPanel from '@/components/game/QuestionPanel';
import LeaderboardPanel from '@/components/game/LeaderboardPanel';
import PlayerCard from '@/components/game/PlayerCard';
import { LeaderboardEntry, Player, Question } from '@/types/game';

interface PublicQuestion extends Question {
  questionNumber?: number;
  totalQuestions?: number;
  stageTitle?: string;
  stageDescription?: string;
  stageNumber?: number;
  visualTheme?: string;
  timeLimitSeconds: number;
}

interface TeamState {
  id?: string;
  teamId?: string;
  name?: string;
  teamName?: string;
  members: Player[];
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

const TOTAL_QUESTIONS = 50;
const TOTAL_STAGES = 10;

function resolveTeamId(team: TeamState | null) {
  return team?.id || team?.teamId || '';
}

function resolveTeamName(team: TeamState | null) {
  return team?.name || team?.teamName || 'Unassigned team';
}

export default function GamePage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
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

  useEffect(() => {
    const displayName = localStorage.getItem('displayName');
    const avatarKey = localStorage.getItem('avatarKey');
    const storedUserId = localStorage.getItem('userId');

    if (!storedUserId || !displayName || !avatarKey) {
      router.push('/');
      return undefined;
    }

    setUserId(storedUserId);

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
    }) => {
      setAnswered(true);
      setWaitingForTeam(true);
      setFeedback({
        isCorrect: data.isCorrect,
        pointsAwarded: data.pointsAwarded,
        correctAnswer: data.correctAnswer,
        userAnswer: data.userAnswer,
      });
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
  const totalQuestions = question?.totalQuestions || TOTAL_QUESTIONS;
  const stageNumber = question?.stageNumber || team?.currentStage || 1;
  const questionProgress = Math.min(100, Math.round((questionNumber / totalQuestions) * 100));
  const connectedMembers = memberCount || team?.members?.length || 0;
  const answeredProgress = connectedMembers
    ? Math.min(100, Math.round((answeredCount / connectedMembers) * 100))
    : 0;

  const screenMode = useMemo(() => {
    if (teamFinished) return 'completed';
    if (waitingForTeam && answered) return 'waiting';
    if (question) return 'playing';
    return 'idle';
  }, [teamFinished, waitingForTeam, answered, question]);

  return (
    <Layout>
      <div className="min-h-screen px-3 py-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dungeon-title text-2xl sm:text-3xl">Conquest of the Dungeon</h1>
              <p className="dungeon-subtitle text-sm sm:text-base">{teamName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="secondary" type="button" onClick={() => router.push('/ranking')}>
                Ranking
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowLeaderboard((value) => !value)}
              >
                {showLeaderboard ? 'Hide board' : 'Leaderboard'}
              </Button>
            </div>
          </header>

          <section className="dungeon-panel overflow-hidden">
            <div className="bg-dungeon-secondary px-4 py-3 sm:px-6">
              <p className="text-xs uppercase tracking-[0.2em] text-dungeon-text-secondary">
                Stage banner
              </p>
              <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="dungeon-title text-lg sm:text-2xl">
                    Stage {stageNumber}/{TOTAL_STAGES}
                  </p>
                  <h2 className="text-base font-bold text-dungeon-text sm:text-xl">
                    {question?.stageTitle || 'Awaiting the next chamber'}
                  </h2>
                </div>
                <p className="text-sm text-dungeon-text-secondary">
                  Rank #{ownStanding?.rank || '—'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 py-3 text-sm sm:grid-cols-4 sm:px-6">
              <div>
                <p className="uppercase text-dungeon-text-secondary">Question</p>
                <p className="font-bold">
                  {questionNumber}/{totalQuestions}
                </p>
              </div>
              <div>
                <p className="uppercase text-dungeon-text-secondary">Answered</p>
                <p className="font-bold">
                  {answeredCount}/{connectedMembers}
                </p>
              </div>
              <div>
                <p className="uppercase text-dungeon-text-secondary">Correct</p>
                <p className="font-bold">{ownStanding?.totalCorrect ?? team?.totalCorrect ?? 0}</p>
              </div>
              <div>
                <p className="uppercase text-dungeon-text-secondary">Time</p>
                <p className="font-bold">{ownStanding?.totalTimeSeconds ?? team?.totalTimeSeconds ?? 0}s</p>
              </div>
            </div>
            <div className="px-4 pb-4 sm:px-6">
              <div className="mb-1 flex justify-between text-xs uppercase text-dungeon-text-secondary">
                <span>Question progress</span>
                <span>{questionProgress}%</span>
              </div>
              <div className="h-3 overflow-hidden border-2 border-dungeon-border bg-dungeon-secondary">
                <div
                  className="h-full bg-dungeon-border transition-all duration-300"
                  style={{ width: `${questionProgress}%` }}
                />
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {screenMode === 'completed' && (
                <Card>
                  <p className="text-xs uppercase tracking-[0.2em] text-dungeon-text-secondary">
                    Team completed
                  </p>
                  <h2 className="dungeon-title mt-2 text-2xl">Your team has finished</h2>
                  <p className="mt-3 text-dungeon-text">
                    You completed all {TOTAL_QUESTIONS} questions. Wait here while the remaining
                    teams finish. The champion is revealed when every team is done.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="dungeon-panel p-3">
                      <p className="uppercase text-dungeon-text-secondary">Final rank</p>
                      <p className="text-xl font-bold">#{ownStanding?.rank || '—'}</p>
                    </div>
                    <div className="dungeon-panel p-3">
                      <p className="uppercase text-dungeon-text-secondary">Correct answers</p>
                      <p className="text-xl font-bold">
                        {ownStanding?.totalCorrect ?? team?.totalCorrect ?? 0}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {screenMode === 'waiting' && (
                <Card>
                  <p className="text-xs uppercase tracking-[0.2em] text-dungeon-text-secondary">
                    Waiting for teammates
                  </p>
                  <h2 className="dungeon-title mt-2 text-2xl">Answer locked in</h2>
                  <p className="mt-3">
                    Stay ready. Your team advances automatically when every connected member
                    answers or the timer expires.
                  </p>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs uppercase text-dungeon-text-secondary">
                      <span>Members answered</span>
                      <span>
                        {answeredCount}/{connectedMembers}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden border-2 border-dungeon-border bg-dungeon-secondary">
                      <div
                        className="h-full bg-dungeon-green transition-all duration-300"
                        style={{ width: `${answeredProgress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {screenMode === 'playing' && question && (
                <>
                  <Card>
                    <p className="mb-3 text-sm uppercase text-dungeon-text-secondary">
                      Question {questionNumber} of {totalQuestions}
                    </p>
                    <TimerBar
                      totalSeconds={question.timeLimitSeconds}
                      remainingSeconds={remainingSeconds}
                      isActive={!answered}
                    />
                  </Card>
                  <QuestionPanel
                    key={question.id}
                    question={question}
                    onSubmit={submitAnswer}
                    isDisabled={answered}
                  />
                </>
              )}

              {screenMode === 'idle' && (
                <Card>
                  <h2 className="dungeon-title text-2xl">Waiting for the next question</h2>
                  <p className="mt-3">
                    Stay connected. Your team advances on its own as soon as everyone answers or
                    time runs out.
                  </p>
                </Card>
              )}

              {feedback && (
                <Card>
                  <p
                    className={`text-xs uppercase tracking-[0.2em] ${
                      feedback.isCorrect ? 'text-dungeon-green' : 'text-dungeon-red'
                    }`}
                  >
                    {feedback.isCorrect ? 'Correct answer' : 'Incorrect answer'}
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    {feedback.isCorrect
                      ? `Correct! +${feedback.pointsAwarded} points`
                      : `Incorrect. The answer was ${feedback.correctAnswer}.`}
                  </h3>
                  {feedback.userAnswer && (
                    <p className="mt-2 text-sm text-dungeon-text-secondary">
                      You selected {feedback.userAnswer}.
                    </p>
                  )}
                </Card>
              )}
            </div>

            <aside className="space-y-4">
              <Card>
                <h3 className="dungeon-title text-lg">Team information</h3>
                <p className="mt-1 text-sm text-dungeon-text-secondary">{teamName}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="uppercase text-dungeon-text-secondary">Ranking position</p>
                    <p className="text-lg font-bold">#{ownStanding?.rank || '—'}</p>
                  </div>
                  <div>
                    <p className="uppercase text-dungeon-text-secondary">Members answered</p>
                    <p className="text-lg font-bold">
                      {answeredCount}/{connectedMembers}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {(team?.members || []).map((member) => (
                    <PlayerCard
                      key={member.id}
                      player={{
                        ...member,
                        isConnected: member.isConnected !== false,
                      }}
                      isCurrentUser={member.id === userId}
                    />
                  ))}
                </div>
              </Card>
              {showLeaderboard && (
                <LeaderboardPanel entries={leaderboard} currentUserTeamId={teamId} />
              )}
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
