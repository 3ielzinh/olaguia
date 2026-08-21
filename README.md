# Clone local — Ecossistema Olá Guia

Clone estático fiel de `https://wcria.cloud/sites/olaguia/`, implementado em HTML, CSS e JavaScript puros com assets armazenados localmente.

## Executar

```bash
npm run dev
```

Abra `http://127.0.0.1:4173/`.

## Publicação

O comando `npm run build` gera a versão estática em `dist/`, usada automaticamente pela Vercel.

## Arquivos principais

- `index.html`: marcação semântica completa e estilos específicos da página.
- `public/`: imagens, fontes, folhas de estilo e scripts locais.
- `server.mjs`: servidor HTTP local sem dependências externas.
- `DESIGN_TOKENS.md`: cores, tipografia, dimensões e breakpoint medidos do original.
- `work/mirror/build-mirror.mjs`: utilitário de reconstrução do espelho a partir da referência pública.

## Verificação

- 18 seções semânticas.
- 23 imagens no DOM e nenhum asset quebrado.
- Conteúdo textual idêntico ao original.
- Desktop e mobile conferidos no mesmo viewport CSS.
- Menu móvel e acordeão de perguntas frequentes preservados.
