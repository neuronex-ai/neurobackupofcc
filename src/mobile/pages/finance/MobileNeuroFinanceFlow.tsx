import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { BankTransferView } from "@/components/financeiro/BankTransferView";
import { PagamentosAgendamento } from "@/components/financeiro/pagamentos/PagamentosAgendamento";
import { ScheduledBillPayments } from "@/components/financeiro/pagamentos/ScheduledBillPayments";
import { PixChaves } from "@/components/financeiro/pix/PixChaves";
import { PixPagarCopiaCola } from "@/components/financeiro/pix/PixPagarCopiaCola";
import { PixReceber } from "@/components/financeiro/pix/PixReceber";
import { PixTransferir } from "@/components/financeiro/pix/PixTransferir";
import { FeatureGate } from "@/components/subscription";
import { Button } from "@/components/ui/button";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import "@/styles/finance-mobile-flows.css";
import { MobileLoadingState, MobilePageHeader, MobilePageScaffold, MobileStatusBanner } from "../../components/MobilePagePrimitives";
import { MobileNeuroFinanceHub } from "./MobileNeuroFinanceHub";
import { MobileNeuroFinanceStatement } from "./MobileNeuroFinanceStatement";
import { MobilePixStaticQrCode } from "./MobilePixStaticQrCode";

type Flow = {
  title: string;
  eyebrow: string;
  description: string;
  critical?: boolean;
  backTo?: string;
  content: ReactNode;
};

const home = "/financeiro/neurofinance";
const pix = `${home}/pix`;

export function MobileNeuroFinanceFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const account = useFinancialAccount();
  const route = location.pathname.slice(`${home}/`.length).replace(/\/$/, "");

  const flows: Record<string, Flow> = {
    pix: { title: "Área Pix", eyebrow: "NeuroFinance", description: "Pague, receba e gerencie suas chaves Pix.", backTo: home, content: <MobileNeuroFinanceHub /> },
    "pix/pagar": { title: "Pagar Pix", eyebrow: "Operação protegida", description: "Consulte o código e revise todos os dados antes do PIN.", critical: true, backTo: pix, content: <PixPagarCopiaCola /> },
    "pix/qrcode": { title: "Gerar QR Code", eyebrow: "Recebimento Pix", description: "Receba por uma chave ativa sem cadastrar o pagador.", critical: true, backTo: pix, content: <MobilePixStaticQrCode /> },
    "pix/recebidos": { title: "Pix recebidos", eyebrow: "Movimentações", description: "Recebimentos confirmados e cobranças em aberto.", backTo: pix, content: <PixReceber /> },
    "pix/chaves": { title: "Chaves Pix", eyebrow: "Recebimento", description: "Gerencie as chaves vinculadas à conta.", backTo: pix, content: <PixChaves /> },
    transferir: { title: "Transferir", eyebrow: "Pix com PIN", description: "Valide o destino no DICT antes de autorizar.", critical: true, backTo: home, content: <PixTransferir /> },
    saque: { title: "Sacar fundos", eyebrow: "Conta de destino", description: "Envie o saldo para uma conta ou chave cadastrada.", critical: true, backTo: home, content: <BankTransferView /> },
    "pagamentos/boleto": { title: "Pagar boleto", eyebrow: "Pagamento protegido", description: "Leia, revise e escolha pagar agora ou agendar.", critical: true, backTo: home, content: <PagamentosAgendamento /> },
    "pagamentos/agendados": { title: "Pagamentos agendados", eyebrow: "Boletos", description: "Consulte programações, retornos e comprovantes.", backTo: home, content: <ScheduledBillPayments /> },
    extrato: { title: "Extrato", eyebrow: "Conta NeuroFinance", description: "Movimentações realizadas, futuras e recorrentes.", backTo: home, content: <MobileNeuroFinanceStatement /> },
  };

  const config = flows[route] || flows.pix;
  const shell = (content: ReactNode) => (
    <MobilePageScaffold showBottomNavigation={!config.critical} contentClassName="pt-[5.75rem]">
      <MobilePageHeader
        title={config.title}
        eyebrow={config.eyebrow}
        description={config.description}
        leading={(
          <Button variant="outline" size="icon" onClick={() => navigate(config.backTo || home)} className="h-11 w-11 rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Button>
        )}
      />
      <div className="mobile-finance-flow pb-5">{content}</div>
    </MobilePageScaffold>
  );

  if (account.isLoading) return shell(<MobileLoadingState label="Sincronizando conta" />);
  if (account.needsInitialOnboarding || account.isAccountMissing) return shell(
    <MobileStatusBanner variant="warning" title="Ative a conta antes de movimentar dinheiro" description="A Gestão Financeira continua disponível. Conclua o onboarding dentro do NeuroFinance." action={<Button onClick={() => navigate(home)} className="h-11 rounded-2xl text-[9px] font-black uppercase tracking-[0.14em]">Abrir NeuroFinance</Button>} />,
  );
  if (!account.isApproved) return shell(
    <MobileStatusBanner variant="warning" title="Conta aguardando liberação" description="As operações ficam protegidas até a conclusão da análise cadastral e documental." action={<Button onClick={() => navigate(home)} variant="outline" className="h-11 rounded-2xl text-[9px] font-black uppercase tracking-[0.14em]">Ver situação da conta</Button>} />,
  );

  return (
    <FeatureGate feature="advanced_finance" fallback={shell(<MobileStatusBanner variant="warning" title="Disponível no plano Profissional" description="A Gestão Financeira permanece acessível sem o módulo bancário." />)}>
      {shell(config.content)}
    </FeatureGate>
  );
}
