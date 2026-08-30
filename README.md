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

- `index.html`: marcação semântica completa, sem tags `<style>` ou atributos `style`.
- `public/css/`: módulos externos `embedded-base.css`, `embedded-components.css`, `embedded-responsive.css` e `embedded-inline-properties.css`.
- `work/extract-embedded-css.mjs`: ferramenta de migração e deduplicação dos valores de propriedades inline.
- `work/build-vercel.mjs`: publica o HTML e os módulos CSS externos sem transformação adicional.
- `server.mjs`: servidor HTTP local sem dependências externas.
- `DESIGN_TOKENS.md`: cores, tipografia, dimensões e breakpoint medidos do original.
- `work/mirror/build-mirror.mjs`: utilitário de reconstrução do espelho a partir da referência pública.

## Desktop e mobile

Em larguras desktop (a partir de 1025px), a página carrega `public/desktop.html`, uma cópia local da referência publicada. Em larguras menores, o `index.html` atual continua sendo usado para preservar a versão mobile já validada.

## Verificação

- 18 seções semânticas.
- 23 imagens no DOM e nenhum asset quebrado.
- Conteúdo textual idêntico ao original.
- Desktop e mobile conferidos no mesmo viewport CSS.
- Menu móvel e acordeão de perguntas frequentes preservados.
