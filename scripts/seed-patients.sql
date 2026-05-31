-- ==============================================================
-- SCRIPT DE SEED: 50 Pacientes de Teste para jotahub@gmail.com
-- Execute este script no SQL Editor do Supabase
-- ==============================================================

-- UUID do psicólogo jotahub@gmail.com
DO $$
DECLARE
    target_user_id UUID := '65505c3e-b338-4163-996a-e2b5b27990d6';
BEGIN
    INSERT INTO public.patients (user_id, name, email, phone, cpf, birth_date, status, session_price, notes, created_at)
    VALUES
    -- Lote 1: Pacientes Ativos
    (target_user_id, 'Ana Paula Silva Santos', 'ana.silva1@teste.neuronex.app', '+5511999901001', '123.456.789-01', '1985-03-15', 'active', 180, 'Diagnóstico: Transtorno de Ansiedade Generalizada. Em acompanhamento desde março/2024.', NOW() - INTERVAL '180 days'),
    (target_user_id, 'Maria Fernanda Oliveira Costa', 'maria.oliveira2@teste.neuronex.app', '+5521999902002', '234.567.890-12', '1990-07-22', 'active', 200, 'Diagnóstico: Episódio Depressivo Moderado. Terapia cognitivo-comportamental.', NOW() - INTERVAL '150 days'),
    (target_user_id, 'José Carlos Rodrigues Pereira', 'jose.rodrigues3@teste.neuronex.app', '+5531999903003', '345.678.901-23', '1978-11-08', 'active', 250, 'Diagnóstico: Transtorno de Pânico. Responde bem ao tratamento.', NOW() - INTERVAL '120 days'),
    (target_user_id, 'João Pedro Ferreira Lima', 'joao.ferreira4@teste.neuronex.app', '+5541999904004', '456.789.012-34', '1995-02-28', 'active', 150, 'Diagnóstico: TDAH - Tipo Combinado. Acompanhamento conjunto com psiquiatra.', NOW() - INTERVAL '90 days'),
    (target_user_id, 'Larissa Beatriz Alves Gomes', 'larissa.alves5@teste.neuronex.app', '+5551999905005', '567.890.123-45', '1988-09-14', 'active', 180, 'Diagnóstico: Transtorno Obsessivo-Compulsivo. Foco em exposição e prevenção de resposta.', NOW() - INTERVAL '200 days'),
    (target_user_id, 'Lucas Gabriel Costa Ribeiro', 'lucas.costa6@teste.neuronex.app', '+5561999906006', '678.901.234-56', '1992-05-03', 'active', 200, 'Diagnóstico: Fobia Social. Progresso gradual com técnicas de dessensibilização.', NOW() - INTERVAL '170 days'),
    (target_user_id, 'Juliana Carolina Martins Soares', 'juliana.martins7@teste.neuronex.app', '+5571999907007', '789.012.345-67', '1983-12-19', 'active', 220, 'Diagnóstico: TEPT. Trauma de infância. Utilizando EMDR.', NOW() - INTERVAL '140 days'),
    (target_user_id, 'Beatriz Amanda Carvalho Fernandes', 'beatriz.carvalho8@teste.neuronex.app', '+5581999908008', '890.123.456-78', '1997-04-07', 'active', 180, 'Diagnóstico: Transtorno Bipolar Tipo II. Estável com medicação.', NOW() - INTERVAL '110 days'),
    (target_user_id, 'Matheus Rafael Almeida Lopes', 'matheus.almeida9@teste.neuronex.app', '+5585999909009', '901.234.567-89', '1991-08-25', 'active', 200, 'Diagnóstico: Depressão Recorrente. Terceiro episódio tratado.', NOW() - INTERVAL '160 days'),
    (target_user_id, 'Mariana Fernanda Vieira Barbosa', 'mariana.vieira10@teste.neuronex.app', '+5519999910010', '012.345.678-90', '1986-01-11', 'active', 250, 'Diagnóstico: Burnout. Executiva de multinacional.', NOW() - INTERVAL '80 days'),
    
    -- Lote 2: Mais Pacientes Ativos
    (target_user_id, 'Pedro Henrique Rocha Dias', 'pedro.rocha11@teste.neuronex.app', '+5511999911011', '111.222.333-44', '1980-06-30', 'active', 180, 'Diagnóstico: Transtorno de Personalidade Borderline. Terapia dialética comportamental.', NOW() - INTERVAL '220 days'),
    (target_user_id, 'Gabriela Isabela Nascimento Andrade', 'gabriela.nascimento12@teste.neuronex.app', '+5521999912012', '222.333.444-55', '1993-10-17', 'active', 150, 'Diagnóstico: Luto Patológico. Perda do pai há 1 ano.', NOW() - INTERVAL '60 days'),
    (target_user_id, 'Rafael Bruno Moreira Nunes', 'rafael.moreira13@teste.neuronex.app', '+5531999913013', '333.444.555-66', '1987-03-24', 'active', 200, 'Diagnóstico: Transtorno Alimentar - Bulimia. Acompanhamento multidisciplinar.', NOW() - INTERVAL '130 days'),
    (target_user_id, 'Amanda Patricia Marques Machado', 'amanda.marques14@teste.neuronex.app', '+5541999914014', '444.555.666-77', '1994-07-09', 'active', 180, 'Diagnóstico: Insônia Crônica. Protocolo de higiene do sono.', NOW() - INTERVAL '100 days'),
    (target_user_id, 'Carlos Eduardo Mendes Freitas', 'carlos.mendes15@teste.neuronex.app', '+5551999915015', '555.666.777-88', '1982-11-28', 'active', 220, 'Diagnóstico: Dificuldades de Relacionamento. Terapia de casal também.', NOW() - INTERVAL '190 days'),
    (target_user_id, 'Fernanda Karen Cardoso Ramos', 'fernanda.cardoso16@teste.neuronex.app', '+5561999916016', '666.777.888-99', '1989-02-14', 'active', 200, 'Diagnóstico: Ansiedade de Separação. Relacionada à mãe idosa.', NOW() - INTERVAL '75 days'),
    (target_user_id, 'Diego Gustavo Gonçalves Santana', 'diego.goncalves17@teste.neuronex.app', '+5571999917017', '777.888.999-00', '1996-05-21', 'active', 150, 'Diagnóstico: Transtorno de Ajustamento. Mudança de carreira.', NOW() - INTERVAL '45 days'),
    (target_user_id, 'Laura Leticia Teixeira Cruz', 'laura.teixeira18@teste.neuronex.app', '+5581999918018', '888.999.000-11', '1984-09-06', 'active', 250, 'Diagnóstico: Síndrome do Pânico com Agorafobia. Melhora significativa.', NOW() - INTERVAL '210 days'),
    (target_user_id, 'Eduardo Felipe Araújo Lima', 'eduardo.araujo19@teste.neuronex.app', '+5585999919019', '999.000.111-22', '1991-12-03', 'active', 180, 'Diagnóstico: Transtorno de Estresse Agudo. Pós-acidente de carro.', NOW() - INTERVAL '30 days'),
    (target_user_id, 'Natalia Marcela Souza Santos', 'natalia.souza20@teste.neuronex.app', '+5519999920020', '000.111.222-33', '1988-04-18', 'active', 200, 'Diagnóstico: Depressão Pós-Parto. Bebê de 8 meses.', NOW() - INTERVAL '55 days'),
    
    -- Lote 3: Pacientes Pendentes
    (target_user_id, 'Renata Sandra Pereira Oliveira', 'renata.pereira21@teste.neuronex.app', '+5511999921021', '111.333.555-77', '1979-08-12', 'pending', 180, 'Primeira consulta agendada. Encaminhamento do clínico geral.', NOW() - INTERVAL '5 days'),
    (target_user_id, 'Bruno Andre Silva Costa', 'bruno.silva22@teste.neuronex.app', '+5521999922022', '222.444.666-88', '1995-01-27', 'pending', 150, 'Primeira consulta agendada. Queixa principal: ansiedade.', NOW() - INTERVAL '3 days'),
    (target_user_id, 'Tatiana Vanessa Rodrigues Ferreira', 'tatiana.rodrigues23@teste.neuronex.app', '+5531999923023', '333.555.777-99', '1990-06-14', 'pending', 200, 'Primeira consulta agendada. Vem de outro terapeuta.', NOW() - INTERVAL '7 days'),
    (target_user_id, 'Caio Daniel Alves Lima', 'caio.alves24@teste.neuronex.app', '+5541999924024', '444.666.888-00', '1986-10-31', 'pending', 180, 'Primeira consulta agendada. Demanda corporativa.', NOW() - INTERVAL '2 days'),
    (target_user_id, 'Jessica Viviane Gomes Martins', 'jessica.gomes25@teste.neuronex.app', '+5551999925025', '555.777.999-11', '1993-03-08', 'pending', 220, 'Primeira consulta agendada. Indicação de amiga.', NOW() - INTERVAL '4 days'),
    
    -- Lote 4: Mais Pacientes Ativos
    (target_user_id, 'Fabio Henrique Carvalho Soares', 'fabio.carvalho26@teste.neuronex.app', '+5561999926026', '666.888.000-22', '1981-07-19', 'active', 250, 'Diagnóstico: Transtorno de Estresse Pós-Traumático. Veterano militar.', NOW() - INTERVAL '240 days'),
    (target_user_id, 'Marcela Isabela Fernandes Vieira', 'marcela.fernandes27@teste.neuronex.app', '+5571999927027', '777.999.111-33', '1997-11-05', 'active', 150, 'Diagnóstico: Ansiedade Social em contexto acadêmico. Universitária.', NOW() - INTERVAL '85 days'),
    (target_user_id, 'Igor Leonardo Barbosa Rocha', 'igor.barbosa28@teste.neuronex.app', '+5581999928028', '888.000.222-44', '1984-02-22', 'active', 200, 'Diagnóstico: Dependência de Álcool em recuperação. 6 meses sóbrio.', NOW() - INTERVAL '180 days'),
    (target_user_id, 'Leticia Sandra Lopes Dias', 'leticia.lopes29@teste.neuronex.app', '+5585999929029', '999.111.333-55', '1992-05-29', 'active', 180, 'Diagnóstico: Transtorno Dismórfico Corporal. Histórico de cirurgias.', NOW() - INTERVAL '150 days'),
    (target_user_id, 'Nicolas Victor Moreira Nascimento', 'nicolas.moreira30@teste.neuronex.app', '+5519999930030', '000.222.444-66', '1989-09-13', 'active', 220, 'Diagnóstico: Fobia Específica - Aviões. Empresário que viaja muito.', NOW() - INTERVAL '95 days'),
    
    -- Lote 5: Pacientes Inativos
    (target_user_id, 'Patricia Otavia Andrade Marques', 'patricia.andrade31@teste.neuronex.app', '+5511999931031', '111.444.777-00', '1976-12-08', 'inactive', 200, 'Alta terapêutica. Completou tratamento com sucesso.', NOW() - INTERVAL '300 days'),
    (target_user_id, 'Sergio Paulo Nunes Machado', 'sergio.nunes32@teste.neuronex.app', '+5521999932032', '222.555.888-11', '1983-04-25', 'inactive', 180, 'Encerrou por questões financeiras. Possível retorno.', NOW() - INTERVAL '270 days'),
    (target_user_id, 'Viviane Thiago Mendes Freitas', 'viviane.mendes33@teste.neuronex.app', '+5531999933033', '333.666.999-22', '1990-08-11', 'inactive', 150, 'Mudou de cidade. Encaminhada para colega.', NOW() - INTERVAL '240 days'),
    (target_user_id, 'Ricardo Andre Cardoso Santos', 'ricardo.cardoso34@teste.neuronex.app', '+5541999934034', '444.777.000-33', '1987-01-16', 'inactive', 250, 'Alta terapêutica. Tratamento de luto concluído.', NOW() - INTERVAL '320 days'),
    (target_user_id, 'Sandra Maria Gonçalves Teixeira', 'sandra.goncalves35@teste.neuronex.app', '+5551999935035', '555.888.111-44', '1994-06-02', 'inactive', 180, 'Interrompeu sem aviso. Tentativa de contato sem sucesso.', NOW() - INTERVAL '180 days'),
    
    -- Lote 6: Mais Pacientes Ativos Diversos
    (target_user_id, 'Marcos Thiago Araújo Cruz', 'marcos.araujo36@teste.neuronex.app', '+5561999936036', '666.999.222-55', '1980-10-28', 'active', 200, 'Diagnóstico: Transtorno de Ansiedade de Doença (Hipocondria). Medo de câncer.', NOW() - INTERVAL '200 days'),
    (target_user_id, 'Carolina Isabela Souza Pereira', 'carolina.souza37@teste.neuronex.app', '+5571999937037', '777.000.333-66', '1998-03-15', 'active', 150, 'Diagnóstico: Autolesão não-suicida. Adolescente em recuperação.', NOW() - INTERVAL '120 days'),
    (target_user_id, 'Felipe Gustavo Silva Oliveira', 'felipe.silva38@teste.neuronex.app', '+5581999938038', '888.111.444-77', '1985-07-22', 'active', 220, 'Diagnóstico: Jogo Patológico. Em abstinência de apostas há 3 meses.', NOW() - INTERVAL '90 days'),
    (target_user_id, 'Isabela Karen Costa Rodrigues', 'isabela.costa39@teste.neuronex.app', '+5585999939039', '999.222.555-88', '1991-11-09', 'active', 180, 'Diagnóstico: Transtorno de Acumulação. Início do tratamento.', NOW() - INTERVAL '40 days'),
    (target_user_id, 'Leonardo Rafael Ferreira Alves', 'leonardo.ferreira40@teste.neuronex.app', '+5519999940040', '000.333.666-99', '1988-04-26', 'active', 250, 'Diagnóstico: Tricotilomania. Arranca cabelos há 10 anos.', NOW() - INTERVAL '170 days'),
    
    -- Lote 7: Últimos Pacientes
    (target_user_id, 'Vanessa Larissa Lima Gomes', 'vanessa.lima41@teste.neuronex.app', '+5511999941041', '111.555.999-00', '1982-09-03', 'active', 200, 'Diagnóstico: Transtorno de Ansiedade Generalizada + Insônia. Comorbidade.', NOW() - INTERVAL '230 days'),
    (target_user_id, 'Andre Caio Martins Costa', 'andre.martins42@teste.neuronex.app', '+5521999942042', '222.666.000-11', '1996-01-20', 'active', 150, 'Diagnóstico: Disforia de Gênero. Acompanhamento psicológico para transição.', NOW() - INTERVAL '140 days'),
    (target_user_id, 'Karen Patricia Carvalho Ribeiro', 'karen.carvalho43@teste.neuronex.app', '+5531999943043', '333.777.111-22', '1989-06-07', 'active', 180, 'Diagnóstico: Síndrome de Burnout Parental. Mãe solo de 3 filhos.', NOW() - INTERVAL '65 days'),
    (target_user_id, 'Daniel Bruno Almeida Fernandes', 'daniel.almeida44@teste.neuronex.app', '+5541999944044', '444.888.222-33', '1979-10-14', 'active', 220, 'Diagnóstico: Luto Complicado. Perda de filho adolescente.', NOW() - INTERVAL '110 days'),
    (target_user_id, 'Leticia Vanessa Vieira Lopes', 'leticia.vieira45@teste.neuronex.app', '+5551999945045', '555.999.333-44', '1993-02-28', 'active', 200, 'Diagnóstico: Transtorno Afetivo Sazonal. Pior no inverno.', NOW() - INTERVAL '195 days'),
    (target_user_id, 'Otavio Sergio Barbosa Soares', 'otavio.barbosa46@teste.neuronex.app', '+5561999946046', '666.000.444-55', '1986-07-11', 'active', 180, 'Diagnóstico: Claustrofobia severa. Evita elevadores e metrô.', NOW() - INTERVAL '155 days'),
    (target_user_id, 'Thiago Victor Rocha Dias', 'thiago.rocha47@teste.neuronex.app', '+5571999947047', '777.111.555-66', '1990-12-24', 'active', 250, 'Diagnóstico: Transtorno de Estresse Pós-Traumático. Assalto violento.', NOW() - INTERVAL '185 days'),
    (target_user_id, 'Renata Juliana Nascimento Andrade', 'renata.nascimento48@teste.neuronex.app', '+5581999948048', '888.222.666-77', '1984-05-19', 'active', 150, 'Diagnóstico: Fobia de Sangue e Agulhas. Problema para exames.', NOW() - INTERVAL '70 days'),
    (target_user_id, 'Gabriel Lucas Moreira Nunes', 'gabriel.moreira49@teste.neuronex.app', '+5585999949049', '999.333.777-88', '1997-08-06', 'active', 200, 'Diagnóstico: Procrastinação Crônica + Baixa Autoestima. Estudante.', NOW() - INTERVAL '50 days'),
    (target_user_id, 'Amanda Beatriz Marques Machado', 'amanda.marques50@teste.neuronex.app', '+5519999950050', '000.444.888-99', '1992-03-13', 'active', 180, 'Diagnóstico: Síndrome do Impostor. Alta executiva de tech.', NOW() - INTERVAL '125 days');
    
    RAISE NOTICE '✅ Successfully inserted 50 test patients for user %', target_user_id;
END $$;

-- Verificação
SELECT COUNT(*) AS total_patients, status, 
       ROUND(AVG(session_price)::numeric, 2) AS avg_price
FROM public.patients 
WHERE user_id = '65505c3e-b338-4163-996a-e2b5b27990d6'
GROUP BY status
ORDER BY total_patients DESC;
