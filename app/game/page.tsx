'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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
const MAX_TEAMS = 50;
const STAGE_RULE = '═══════════════════════════';

function resolveTeamId(team: TeamState | null) {
  return team?.id || team?.teamId || '';
}

function resolveTeamName(team: TeamState | null) {
  return team?.name || team?.teamName || 'Unassigned team';
}

function GoldRule() {
  return (
    <p className="overflow-hidden text-center font-bold tracking-[0.18em] text-[#d4af37] sm:tracking-[0.35em]">
      {STAGE_RULE}
    </p>
  );
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
  const timerPercent = question?.timeLimitSeconds
    ? Math.max(0, Math.min(100, (remainingSeconds / question.timeLimitSeconds) * 100))
    : 0;
  const timerBarClass =
    timerPercent > 50
      ? 'bg-dungeon-green'
      : timerPercent > 25
        ? 'bg-yellow-400'
        : 'bg-dungeon-red';
  const timerTextClass =
    timerPercent > 50
      ? 'text-dungeon-green'
      : timerPercent > 25
        ? 'text-yellow-400'
        : 'text-dungeon-red';

  const screenMode = useMemo(() => {
    if (teamFinished) return 'completed';
    if (waitingForTeam && answered) return 'waiting';
    if (question) return 'playing';
    return 'idle';
  }, [teamFinished, waitingForTeam, answered, question]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a0e27] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="dungeon-title text-2xl sm:text-3xl lg:text-4xl">
                Conquest of the Dungeon
              </h1>
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

          <section className="dungeon-panel overflow-hidden bg-[#1a1f3a] px-4 py-5 text-center sm:px-8 sm:py-7">
            <GoldRule />
            <p className="dungeon-title mt-3 text-xl tracking-[0.25em] sm:text-3xl sm:tracking-[0.35em]">
              STAGE {stageNumber} OF {TOTAL_STAGES}
            </p>
            <h2 className="mt-2 text-xl font-black uppercase leading-tight text-[#e0e6ff] sm:text-3xl">
              {question?.stageTitle || 'Awaiting the next chamber'}
            </h2>
            <GoldRule />
            <p className="mx-auto mt-3 max-w-2xl text-sm italic text-[#8892b0] sm:text-base">
              {question?.stageDescription || 'The dungeon waits in silence.'}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="space-y-4 lg:col-span-2">
              {screenMode === 'completed' && (
                <div className="dungeon-panel border-[#d4af37] bg-[#141829] px-5 py-8 text-center sm:px-10">
                  <p className="dungeon-title text-3xl sm:text-4xl">🏆 MISSION COMPLETED</p>
                  <p className="mt-4 text-lg font-bold text-[#e0e6ff]">Team: {teamName}</p>
                  <p className="mt-2 text-base text-[#e0e6ff]">
                    Correct Answers: {ownStanding?.totalCorrect ?? team?.totalCorrect ?? 0}
                  </p>
                  <p className="mt-1 text-base text-[#d4af37]">
                    Current Rank: #{ownStanding?.rank || '—'}
                  </p>
                  <p className="mt-6 text-sm uppercase tracking-[0.2em] text-[#8892b0]">
                    Waiting for remaining teams...
                  </p>
                </div>
              )}

              {screenMode === 'waiting' && (
                <Card>
                  <p className="text-center text-xs uppercase tracking-[0.28em] text-[#d4af37]">
                    Waiting for teammates
                  </p>
                  <h2 className="dungeon-title mt-3 text-center text-2xl sm:text-3xl">
                    Answer locked in
                  </h2>
                  <p className="mt-3 text-center text-[#8892b0]">
                    Your party advances when every connected member answers or the timer expires.
                  </p>
                </Card>
              )}

              {screenMode === 'playing' && question && (
                <>
                  <div className="dungeon-panel bg-[#141829] px-4 py-6 text-center sm:px-8">
                    <p className={`text-lg font-black uppercase tracking-wide ${timerTextClass}`}>
                      {remainingSeconds} {remainingSeconds === 1 ? 'Second' : 'Seconds'} Remaining
                    </p>
                    <div className="mx-auto mt-4 h-6 max-w-xl overflow-hidden border-2 border-[#d4af37] bg-[#0a0e27] sm:h-8">
                      <div
                        className={`h-full transition-all duration-200 ${timerBarClass}`}
                        style={{ width: `${timerPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="dungeon-panel bg-[#1a1f3a] p-4 sm:p-6">
                    <p className="mb-4 text-center text-xs uppercase tracking-[0.28em] text-[#d4af37]">
                      Question {questionNumber} of {totalQuestions}
                    </p>
                    <p className="mb-6 text-2xl font-black leading-snug text-[#e0e6ff] sm:text-3xl">
                      {question.questionText}
                    </p>
                    <div className="[&_.dungeon-title]:hidden [&_p.text-lg]:hidden [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0">
                      <QuestionPanel
                        key={question.id}
                        question={question}
                        onSubmit={submitAnswer}
                        isDisabled={answered}
                      />
                    </div>
                  </div>
                </>
              )}

              {screenMode === 'idle' && (
                <Card>
                  <h2 className="dungeon-title text-2xl">Waiting for the next question</h2>
                  <p className="mt-3 text-[#8892b0]">
                    Stay connected. Your team advances on its own as soon as everyone answers or
                    time runs out.
                  </p>
                </Card>
              )}

              {feedback && (
                <div
                  className={`border-2 px-5 py-6 text-center ${
                    feedback.isCorrect
                      ? 'border-dungeon-green bg-[#10261a]'
                      : 'border-dungeon-red bg-[#2a1216]'
                  }`}
                >
                  {feedback.isCorrect ? (
                    <>
                      <p className="text-2xl font-black uppercase tracking-[0.2em] text-dungeon-green sm:text-3xl">
                        ✅ CORRECT
                      </p>
                      <p className="mt-3 text-xl font-black text-[#d4af37] sm:text-2xl">
                        +{feedback.pointsAwarded} POINTS
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-black uppercase tracking-[0.2em] text-dungeon-red sm:text-3xl">
                        ❌ INCORRECT
                      </p>
                      <p className="mt-3 text-lg font-bold text-[#e0e6ff]">
                        Correct Answer: {feedback.correctAnswer}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="dungeon-panel bg-[#141829] p-4 text-center sm:p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[#d4af37]">🏆 TEAM RANK</p>
                <p className="dungeon-title mt-2 text-4xl sm:text-5xl">
                  #{ownStanding?.rank || '—'}
                </p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-[#8892b0]">
                  OF {MAX_TEAMS}
                </p>
              </div>

              <div className="dungeon-panel bg-[#1a1f3a] p-4 sm:p-5">
                <p className="text-center text-xs uppercase tracking-[0.28em] text-[#d4af37]">
                  QUESTION PROGRESS
                </p>
                <div className="mt-4 h-5 overflow-hidden border-2 border-[#d4af37] bg-[#0a0e27]">
                  <div
                    className="h-full bg-[#d4af37] transition-all duration-300"
                    style={{ width: `${questionProgress}%` }}
                  />
                </div>
                <p className="mt-3 text-center text-sm font-bold uppercase tracking-wide">
                  Question {questionNumber} / {totalQuestions}
                </p>
              </div>

              <div className="dungeon-panel bg-[#1a1f3a] p-4 sm:p-5">
                <p className="text-center text-xs uppercase tracking-[0.28em] text-[#d4af37]">
                  TEAM STATUS
                </p>
                <p className="mt-3 text-center text-sm uppercase text-[#8892b0]">Members Answered</p>
                <p className="mt-1 text-center text-3xl font-black text-[#e0e6ff]">
                  {answeredCount} / {connectedMembers}
                </p>
                <div className="mt-4 h-4 overflow-hidden border-2 border-[#d4af37] bg-[#0a0e27]">
                  <div
                    className="h-full bg-dungeon-green transition-all duration-300"
                    style={{ width: `${answeredProgress}%` }}
                  />
                </div>
              </div>

              <Card>
                <h3 className="dungeon-title text-lg">{teamName}</h3>
                <div className="mt-4 space-y-3">
                  {(team?.members || []).map((member) => {
                    const connected = member.isConnected !== false;
                    return (
                      <div key={member.id}>
                        <PlayerCard
                          player={{ ...member, isConnected: connected }}
                          isCurrentUser={member.id === userId}
                        />
                        <p
                          className={`mt-1 text-xs font-bold uppercase tracking-wide ${
                            connected ? 'text-dungeon-green' : 'text-dungeon-red'
                          }`}
                        >
                          {connected ? '🟢 Connected' : '🔴 Disconnected'}
                        </p>
                      </div>
                    );
                  })}
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
