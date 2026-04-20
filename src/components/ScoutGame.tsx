'use client'

import { useCallback } from 'react'
import { Board } from '@/components/Board'
import { ConnectionBanner } from '@/components/ConnectionBanner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Lobby } from '@/components/Lobby'
import { ScoutHeader } from '@/components/ScoutHeader'
import { SquareDetailDialog } from '@/components/SquareDetailDialog'
import { UploadOverlay } from '@/components/UploadOverlay'
import { GameProvider, useGame } from '@/hooks/useGameState'
import { useGeolocation } from '@/hooks/useGeolocation'
import { usePhotoUpload } from '@/hooks/usePhotoUpload'
import { useScoutSocket } from '@/hooks/useScoutSocket'
import { useSocket } from '@/hooks/useSocket'
import { GAME_STATUS } from '@/lib/constants'

function ScoutGameInner({ gameId }: { gameId: string }) {
  const socket = useSocket()
  const { state, dispatch } = useGame()

  useScoutSocket(socket, dispatch, gameId)
  useGeolocation(socket, state.status === GAME_STATUS.ACTIVE)

  const {
    uploadStage,
    failedUpload,
    pendingItems,
    selectedItem,
    fileInputRef,
    handleFileSelected,
    handleCancelUpload,
    handleSquareTap,
    handleConfirmPhoto,
    handleCancelSelection,
  } = usePhotoUpload({
    gameId,
    teamId: state.myTeam?.id,
    board: state.board,
    mySubmissions: state.mySubmissions,
    socket,
    dispatch,
  })

  const handleSwitchTeam = useCallback(
    (teamName: string) => {
      if (!socket) return
      socket.emit('team:switch', { targetTeamName: teamName })
    },
    [socket],
  )

  switch (state.status) {
    case GAME_STATUS.LOBBY:
      return (
        <Lobby
          myTeam={state.myTeam}
          teams={state.teams}
          role="scout"
          teamsLocked={state.teamsLocked}
          onSwitchTeam={handleSwitchTeam}
        />
      )
    case GAME_STATUS.ACTIVE:
      return (
        <div className="flex h-[calc(100dvh)] flex-col">
          {uploadStage && (
            <UploadOverlay stage={uploadStage} onCancel={handleCancelUpload} />
          )}
          <SquareDetailDialog
            displayName={selectedItem?.displayName ?? null}
            open={selectedItem !== null}
            onOpenChange={(open) => {
              if (!open) handleCancelSelection()
            }}
            onTakePhoto={handleConfirmPhoto}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelected}
          />
          {state.roundStartedAt && (
            <ScoutHeader
              roundStartedAt={state.roundStartedAt}
              board={state.board}
              myTeamId={state.myTeam?.id ?? null}
              myTeamColour={state.myTeam?.colour ?? null}
              teams={state.teams}
            />
          )}
          <Board
            items={state.board}
            role="scout"
            myTeamId={state.myTeam?.id ?? null}
            pendingItems={pendingItems}
            failedItemId={failedUpload?.roundItemId ?? null}
            onSquareTap={handleSquareTap}
          />
        </div>
      )
    case GAME_STATUS.ENDED: {
      const myScore =
        state.summary?.find((t) => t.teamId === state.myTeam?.id)
          ?.claimedCount ?? 0
      return (
        <div className="relative flex h-[calc(100dvh)] flex-col">
          <Board
            items={state.board}
            role="scout"
            myTeamId={state.myTeam?.id ?? null}
            onSquareTap={() => {}}
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70">
            <h1 className="mb-2 text-center text-4xl font-extrabold text-white drop-shadow-lg">
              Head back to base!
            </h1>
            <p className="rounded-full bg-white/20 px-6 py-2 text-center text-xl font-bold text-white backdrop-blur">
              Your team claimed {myScore} {myScore === 1 ? 'square' : 'squares'}
            </p>
          </div>
        </div>
      )
    }
    default:
      return <div>Loading...</div>
  }
}

export function ScoutGame({ gameId }: { gameId: string }) {
  return (
    <ErrorBoundary>
      <GameProvider>
        <ConnectionBanner />
        <ScoutGameInner gameId={gameId} />
      </GameProvider>
    </ErrorBoundary>
  )
}
