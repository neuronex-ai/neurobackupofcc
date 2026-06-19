# Microsoft Store Submission - NeuroNex AI

This checklist keeps the Microsoft Store package separate from the current NSIS desktop build.

## Listing

Headline:

NeuroNex AI - Gestao, Prontuario e IA para Psicologos

Description:

O NeuroNex AI e o sistema operacional com Inteligencia Artificial voltado exclusivamente para Psicologos. Simplifique a gestao da sua clinica, organize prontuarios eletronicos com maxima seguranca e utilize ferramentas avancadas de IA para otimizar suas analises, relatorios e rotinas de psicologia clinica.

Keywords:

IA para psicologos, Psicologia, Prontuario Eletronico, Gestao de Clinica, AI, Anamnese, NeuroNex

## Partner Center Values Needed

Replace these placeholders in `electron-builder.store.json5` after the company validation finishes:

- `appx.identityName`: exact package identity reserved in Partner Center.
- `appx.publisher`: exact Publisher subject, usually shaped like `CN=...`.

Do not guess these values. They must match Partner Center exactly.

## Build Commands

Regular desktop installer:

```bash
npm run electron:build
```

Microsoft Store package:

```bash
npm run electron:build:store
```

## Store Packaging Notes

- The existing NSIS build remains unchanged.
- The Store build uses `electron-builder.store.json5` and targets AppX/MSIX for Microsoft Store.
- Microsoft Store signs and updates the package after submission.
- `electron-updater` remains useful for NSIS distribution, but Store users receive updates through Microsoft Store.
- Native desktop notifications use the packaged app identity through Electron and Windows toast notifications.

## Pre-Submission QA

- Build and launch `npm run electron:preview`.
- Sign in, create account, open Agenda, Pacientes, Financeiro, NeuroFinance, Teleconsulta and mobile-responsive views.
- Enable desktop notifications in `Ajustes > Notificacoes`.
- Trigger at least one critical notification while the app is minimized.
- Confirm the notification click focuses NeuroNex and navigates to the expected screen.
- Verify no Asaas API key/access-token event appears for psychologist users.
