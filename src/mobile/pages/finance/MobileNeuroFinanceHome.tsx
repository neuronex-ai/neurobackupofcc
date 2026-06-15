import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { CustomOnboardingFlow } from "@/components/financeiro/CustomOnboardingFlow";
import { RequirementsList } from "@/components/financeiro/RequirementsList";
import { FeatureGate } from "@/components/subscription";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { formatCurrency } from "@/lib/utils";
import { MobileActionListItem, MobileLoadingState, MobilePageHeader, MobilePageScaffold, MobileSectionHeader, MobileStatusBanner } from "../../components/MobilePagePrimitives";
import { MobileNeuroFinanceHub } from "./MobileNeuroFinanceHub";

export function MobileNeuroFinanceHome() {
  const navigate = useNavigate();
  const account = useFinancialAccount();
  const balance = useNeuroFinanceBalance();
  const [showBalance, setShowBalance] = useState(true);
  const [onboarding, setOnboarding] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);

  if (onboarding) {
    return (
      <MobilePageScaffold immersive showNavigation={false} showBottomNavigation={false} contentClassName="px-0 pb-0">
        <CustomOnboardingFlow
          fullScreen
          onCancel={() => setOnboarding(false)}
          onComplete={async () => {
            await account.syncAccount.mutateAsync();
            await account.refetch();
            setOnboarding(false);
          }}
        />
      </MobilePageScaffold>
    );
  }

  return (
    <MobilePageScaffold contentClassName="pt-[5.75rem]">
      <MobilePageHeader
        eyebrow="Conta digital"
        title="NeuroFinance"
        description="Pix, pagamentos, transferências e saldo real em uma área separada da Gestão."
        leading={(
          <Button variant="outline" size="icon" onClick={() => navigate("/financeiro")} className="h-11 w-11 rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar para Gestão</span>
          </Button>
        )}
      />

      <FeatureGate
        feature="advanced_finance"
        fallback={(
          <MobileStatusBanner
            variant="warning"
            title="NeuroFinance disponível no plano Profissional"
            description="A Gestão Financeira continua liberada sem a conta bancária."
            action={<Button onClick={() => navigate("/financeiro")} variant="outline" className="h-11 rounded-2xl text-[9px] font-black uppercase tracking-[0.14em]">Voltar para Gestão</Button>}
          />
        )}
      >
        {account.isLoading ? (
          <MobileLoadingState label="Sincronizando conta" />
        ) : account.needsInitialOnboarding || account.isAccountMissing ? (
          <section className="overflow-hidden rounded-[32px] border border-border/40 bg-foreground p-6 text-background shadow-xl dark:border-white/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-background/10"><Sparkles className="h-6 w-6" /></div>
            <p className="mt-8 text-[9px] font-black uppercase tracking-[0.2em] opacity-55">Conta digital</p>
            <h2 className="mt-2 text-3xl font-black leading-[0.95] tracking-[-0.055em]">Ative o NeuroFinance.</h2>
            <p className="mt-4 text-sm font-medium leading-relaxed opacity-65">A Gestão já funciona sem conta bancária. Abra o NeuroFinance apenas para movimentar dinheiro real.</p>
            <div className="mt-6 grid gap-2">
              {["Pix, boleto e cobranças", "Transferências e saques", "Saldo e extrato bancário"].map((item) => (
                <div key={item} className="rounded-2xl border border-background/10 bg-background/[0.06] px-4 py-3 text-[10px] font-black uppercase tracking-[0.11em] opacity-75">{item}</div>
              ))}
            </div>
            <Button onClick={() => setOnboarding(true)} className="mt-7 h-13 w-full rounded-2xl bg-background text-[9px] font-black uppercase tracking-[0.17em] text-foreground hover:bg-background/90">Começar agora <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </section>
        ) : (
          <div className="space-y-6">
            {!account.isApproved ? (
              <MobileStatusBanner
                variant="warning"
                title={account.isAwaitingDocuments ? "Documentos necessários" : account.isAwaitingApproval ? "Conta em análise" : "Ativação em andamento"}
                description={account.isAwaitingDocuments ? "Envie os documentos solicitados para liberar as operações." : "As movimentações permanecem protegidas até a aprovação da conta."}
                action={<Button onClick={() => setVerificationOpen(true)} variant="outline" className="h-10 rounded-xl text-[8px] font-black uppercase tracking-[0.13em]">Abrir verificação</Button>}
              />
            ) : null}

            <section className="rounded-[30px] border border-border/40 bg-card/80 p-6 dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[17px] bg-foreground/[0.05] text-muted-foreground"><Wallet className="h-5 w-5" /></div>
                  <div><p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/55">Saldo disponível</p><p className="mt-1 text-[10px] font-bold text-muted-foreground">Conta NeuroFinance</p></div>
                </div>
                <button type="button" onClick={() => setShowBalance((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/[0.045] text-muted-foreground">{showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
              </div>
              <div className="mt-8">
                {balance.isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/35" /> : <p className="text-4xl font-black tracking-[-0.06em] text-foreground">{showBalance ? formatCurrency(balance.data?.balance || 0) : "R$ ••••••"}</p>}
                <p className="mt-2 text-[10px] font-bold text-muted-foreground/55">{showBalance ? `${formatCurrency(balance.data?.pending || 0)} a liberar` : "Saldo protegido"}</p>
              </div>
            </section>

            {account.isApproved ? <MobileNeuroFinanceHub /> : (
              <section className="space-y-3">
                <MobileSectionHeader eyebrow="Conta protegida" title="Operações indisponíveis" description="Conclua a verificação para liberar Pix, boletos, saques e extrato." />
                <MobileActionListItem icon={ShieldCheck} title="Saúde da conta" description="Acompanhe pendências cadastrais e documentais." status="Requer ação" onClick={() => setVerificationOpen(true)} />
              </section>
            )}
          </div>
        )}
      </FeatureGate>

      <Dialog open={verificationOpen} onOpenChange={(open) => { setVerificationOpen(open); if (open) account.refetch(); }}>
        <DialogContent className="h-[88dvh] w-[calc(100vw-1rem)] max-w-lg overflow-hidden rounded-[28px] border-border/40 bg-background p-0 dark:border-white/10">
          <DialogHeader className="border-b border-border/40 p-5 text-left dark:border-white/10">
            <DialogTitle className="text-xl font-black tracking-[-0.04em]">Saúde da conta</DialogTitle>
            <DialogDescription className="text-xs font-medium leading-relaxed">Acompanhe pendências e conclua as etapas necessárias.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 overscroll-y-contain">
            <RequirementsList onSelectRequirement={() => undefined} activeRequirement={null} />
            {verificationOpen ? <div className="mt-4 overflow-hidden rounded-[24px] border border-border/40 dark:border-white/10"><CustomOnboardingFlow fullScreen={false} onComplete={() => { setVerificationOpen(false); account.syncAccount.mutate(); }} /></div> : null}
          </div>
        </DialogContent>
      </Dialog>
    </MobilePageScaffold>
  );
}
