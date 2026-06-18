import { useDesktopClinicalSession, formatSessionElapsed } from '@/hooks/use-desktop-clinical-session';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types';
import { DesktopSessionReviewDialog } from './DesktopSessionReviewDialog';
import { DesktopSessionStage } from './DesktopSessionStage';
import { DesktopSessionWorkspace } from './DesktopSessionWorkspace';
import { DesktopTeleconsultationLobby } from './DesktopTeleconsultationLobby';
import { InvitePatientModal } from './InvitePatientModal';
import { TranscriptionConsentPanel } from './TranscriptionConsentPanel';

interface DesktopClinicalSessionProps {
  activeAppointment: Appointment;
  patientName: string;
  onSessionEnd: () => void;
}

const DESKTOP_SESSION_TOP_OFFSET = 'top-[104px]';

export const DesktopClinicalSession = ({
  activeAppointment,
  patientName,
  onSessionEnd,
}: DesktopClinicalSessionProps) => {
  const session = useDesktopClinicalSession(activeAppointment, patientName, onSessionEnd);

  if (session.showLobby) {
    return (
      <div className={cn('fixed inset-x-0 bottom-0 z-[100] overflow-hidden bg-background', DESKTOP_SESSION_TOP_OFFSET)}>
        <DesktopTeleconsultationLobby
          patientName={patientName}
          patient={session.patient}
          appointmentId={session.appointmentId}
          appointmentStart={activeAppointment.start_time}
          meetLink={session.effectiveMeetLink}
          therapistName={session.therapistName}
          isOnline={session.isOnlineSession}
          isLoadingToken={session.isOnlineSession && session.isLoadingToken}
          onJoin={session.handleJoinSession}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cn('fixed inset-x-0 bottom-0 z-[100] overflow-hidden bg-background', DESKTOP_SESSION_TOP_OFFSET)}>
        <div
          className={cn(
            'grid h-full min-h-0 gap-4 p-4 xl:p-5',
            session.isFocusMode
              ? 'grid-cols-1'
              : 'grid-cols-[minmax(0,1.2fr)_minmax(520px,0.8fr)]',
          )}
        >
          <DesktopSessionStage
            user={session.user}
            patientName={patientName}
            appointmentId={session.appointmentId}
            patientRiskScore={session.patient?.risk_score || 0}
            therapistName={session.therapistName}
            therapistAvatar={session.therapistAvatar}
            isOnlineSession={session.isOnlineSession}
            roomName={session.roomName}
            effectiveMeetLink={session.effectiveMeetLink}
            jitsiToken={session.jitsiToken}
            jitsiError={session.jitsiError}
            mediaSettings={session.mediaSettings}
            jitsiRef={session.jitsiRef}
            reviewRequestedRef={session.reviewRequestedRef}
            hasJoined={session.hasJoined}
            elapsedLabel={formatSessionElapsed(session.elapsedSeconds)}
            captureLabel={session.captureLabel}
            syncLabel={session.syncLabel}
            syncState={session.syncState}
            hasNetwork={session.hasNetwork}
            isCaptureEnabled={session.isCaptureEnabled}
            captureAvailable={session.captureAvailable}
            speechSupported={session.speechSupported}
            interimText={session.interimText}
            isFocusMode={session.isFocusMode}
            isProcessing={session.isProcessing}
            isScreenSharing={session.isScreenSharing}
            isAudioEnabled={session.isAudioEnabled}
            isVideoEnabled={session.isVideoEnabled}
            isChatOpen={session.isChatOpen}
            onConferenceJoined={() => {
              session.setHasJoined(true);
              session.setShowLobby(false);
            }}
            onMeetingEnd={() => void session.requestReview()}
            onTranscriptUpdate={session.appendJitsiSegment}
            onMuteStatusChanged={({ audio, video }) => {
              session.setIsAudioEnabled(!audio);
              session.setIsVideoEnabled(!video);
            }}
            onRetrySync={() => void session.retrySync()}
            onToggleFocus={session.toggleFocusMode}
            onRequestReview={() => void session.requestReview()}
            onToggleScreenShare={session.toggleScreenShare}
            onToggleAudio={session.toggleAudio}
            onToggleVideo={session.toggleVideo}
            onToggleChat={() => session.setIsChatOpen((current) => !current)}
            onOpenInvite={() => session.setShowInviteModal(true)}
            onToggleCapture={() => void session.handleToggleCapture()}
            onCloseChat={() => session.setIsChatOpen(false)}
          />

          {!session.isFocusMode ? (
            <DesktopSessionWorkspace
              patient={session.patient}
              patientName={patientName}
              segments={session.segments}
              interimText={session.interimText}
              notes={session.notesDraft.notes}
              onNotesChange={session.notesDraft.setNotes}
              notesSyncState={session.notesDraft.syncState}
              captureLabel={session.captureLabel}
              syncLabel={session.syncLabel}
              syncState={session.syncState}
              isCaptureEnabled={session.isCaptureEnabled}
              captureAvailable={session.captureAvailable}
              onToggleCapture={() => void session.handleToggleCapture()}
              onRetrySync={() => void session.retrySync()}
            />
          ) : null}
        </div>
      </div>

      <InvitePatientModal
        isOpen={session.showInviteModal}
        onClose={() => session.setShowInviteModal(false)}
        patient={session.patient}
        meetLink={session.effectiveMeetLink}
      />

      {session.showConsent && session.hasJoined && !session.reviewOpen ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/62 p-6 backdrop-blur-md">
          <div className="w-full max-w-2xl">
            <TranscriptionConsentPanel
              patientName={patientName}
              isPending={session.captureState === 'restoring' || session.captureState === 'finalizing'}
              onGrant={session.handleGrantConsent}
              onDecline={session.handleDeclineConsent}
            />
          </div>
        </div>
      ) : null}

      <DesktopSessionReviewDialog
        open={session.reviewOpen}
        patientName={patientName}
        transcript={session.reviewTranscript}
        notes={session.reviewNotes}
        segmentsCount={session.segments.length}
        hasNetwork={session.hasNetwork}
        canGenerate={Boolean(session.patientId)}
        isProcessing={session.isProcessing}
        completionMode={session.completionMode}
        error={session.completionError || session.lastError}
        onTranscriptChange={session.setReviewTranscript}
        onNotesChange={session.setReviewNotes}
        onGenerate={() => void session.completeWithAi()}
        onPreserve={() => void session.completeWithoutAi()}
      />
    </>
  );
};
