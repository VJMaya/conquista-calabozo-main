'use client';

import { useEffect, useRef, useState } from 'react';
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
  stageNumber?: number;
  timeLimitSeconds: number;
}

interface TeamState {
  id: string;
  name: string;
  members: Player[];
  totalCorrect: number;
  completed?: boolean;
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
  const [lastResult, setLastResult] = useState('');
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
    });

    socket.on('question:show', (data: PublicQuestion) => {
      const limit = data.timeLimitSeconds || 30;
      setQuestion({ ...data, timeLimitSeconds: limit, questionType: data.questionType || 'multiple_choice' });
      setRemainingSeconds(limit);
      setAnswered(false);
      setWaitingForTeam(false);
      setTeamFinished(false);
      setLastResult('');
      setAnsweredCount(0);
    });

    socket.on('answer:result', (data: {
      isCorrect: boolean;
      pointsAwarded: number;
      correctAnswer: string;
    }) => {
      setAnswered(true);
      setWaitingForTeam(true);
      setLastResult(
        data.isCorrect
          ? `Correct! +${data.pointsAwarded} points`
          : `Incorrect. The answer was ${data.correctAnswer}.`
      );
    });

    socket.on('team:answer_status', (data: { answeredCount?: number; memberCount?: number }) => {
      setAnsweredCount(data.answeredCount || 0);
      setMemberCount(data.memberCount || 0);
    });

    socket.on('question:completed', (data: { totalCorrect?: number }) => {
      setWaitingForTeam(false);
      setLastResult(`Team advancing. Total correct answers: ${data.totalCorrect ?? 0}`);
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

  const ownStanding = leaderboard.find((entry) => entry.teamId === team?.id);

  return (
    <Layout>
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="dungeon-title text-3xl">Conquest of the Dungeon</h1>
              <p className="dungeon-subtitle">
                {team ? team.name : 'Waiting for team assignment'}
              </p>
            </div>
            <div className="flex gap-3">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {teamFinished && (
                <Card>
                  <h2 className="dungeon-title text-2xl mb-2">Your team has finished</h2>
                  <p>
                    You completed all 50 questions. Wait for the remaining teams. The champion is
                    revealed when every team is done.
                  </p>
                </Card>
              )}

              {!teamFinished && question && (
                <>
                  <Card>
                    <p className="text-sm uppercase text-dungeon-text-secondary mb-2">
                      Stage {question.stageNumber || 1}/10 · {question.stageTitle || 'Dungeon'}
                    </p>
                    <p className="font-bold mb-4">
                      Question {question.questionNumber || 1}/{question.totalQuestions || 50}
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
                  {lastResult && (
                    <Card>
                      <p>{lastResult}</p>
                      {waitingForTeam && (
                        <p className="text-sm text-dungeon-text-secondary mt-2">
                          Waiting for teammates ({answeredCount}/{memberCount || team?.members.length || 0}).
                          Your team continues automatically.
                        </p>
                      )}
                    </Card>
                  )}
                </>
              )}

              {!teamFinished && !question && (
                <Card>
                  <h2 className="dungeon-title text-2xl mb-2">Waiting for the next question</h2>
                  <p>
                    Stay connected. Your team advances on its own as soon as everyone answers or
                    time runs out.
                  </p>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <h3 className="dungeon-title text-lg mb-2">Your team</h3>
                {ownStanding && (
                  <p className="text-sm text-dungeon-text-secondary mb-4">
                    Rank #{ownStanding.rank} · {ownStanding.totalCorrect} correct · {ownStanding.totalTimeSeconds}s
                  </p>
                )}
                <div className="space-y-3">
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
                <LeaderboardPanel entries={leaderboard} currentUserTeamId={team?.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
