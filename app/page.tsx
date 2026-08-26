// app/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { AvatarClass } from '@/types/game';

const AVATAR_CLASSES: { key: AvatarClass; emoji: string; name: string }[] = [
  { key: 'fairy', emoji: '✨', name: 'Hada' },
  { key: 'wizard', emoji: '🧙', name: 'Mago' },
  { key: 'knight', emoji: '⚔️', name: 'Caballero' },
  { key: 'archer', emoji: '🏹', name: 'Arquero' },
  { key: 'elf', emoji: '🧝', name: 'Elfo' },
  { key: 'dwarf', emoji: '⛏️', name: 'Enano' },
];

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarClass>('knight');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!displayName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, avatarKey: selectedAvatar }),
      });

      if (!response.ok) {
        throw new Error('Error al crear perfil');
      }

      const data = await response.json();
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('displayName', displayName);
      localStorage.setItem('avatarKey', selectedAvatar);

      router.push('/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Game Title */}
          <div className="text-center mb-12">
            <h1 className="dungeon-title text-4xl mb-2">CONQUISTA</h1>
            <h1 className="dungeon-title text-4xl mb-6">DEL CALABOZO</h1>
            <p className="dungeon-subtitle text-2xl mb-2">Medieval Fantasy Online</p>
            <div className="text-5xl mt-4">⚔️🏰</div>
          </div>

          {/* Login Form */}
          <div className="dungeon-panel p-6 mb-6">
            <div className="mb-6">
              <Input
                label="Nombre del Jugador"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError('');
                }}
                placeholder="Tu nombre aventurero..."
                maxLength={50}
                disabled={isLoading}
              />
            </div>

            {/* Avatar Selection */}
            <div className="mb-6">
              <label className="block text-dungeon-text-secondary mb-3 uppercase text-sm font-bold">
                Selecciona tu Clase
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_CLASSES.map((avatar) => (
                  <button
                    key={avatar.key}
                    onClick={() => setSelectedAvatar(avatar.key)}
                    disabled={isLoading}
                    className={`p-3 border-2 transition-all text-center ${
                      selectedAvatar === avatar.key
                        ? 'bg-dungeon-border text-dungeon-bg border-dungeon-border'
                        : 'bg-dungeon-secondary text-dungeon-text border-dungeon-text-secondary hover:border-dungeon-border'
                    }`}
                  >
                    <div className="text-2xl mb-1">{avatar.emoji}</div>
                    <p className="text-xs font-bold uppercase">{avatar.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-dungeon-red text-dungeon-bg border-2 border-dungeon-red">
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <Button
              onClick={handleJoin}
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? 'Creando Perfil...' : 'Entrar al Calabozo'}
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-center text-dungeon-text-secondary text-xs uppercase">
            <p className="mb-2">⚡ Juego Multijugador en Tiempo Real</p>
            <p className="mb-2">🎯 10 Etapas • 45 Minutos</p>
            <p>👥 Equipos de 5 Jugadores</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
