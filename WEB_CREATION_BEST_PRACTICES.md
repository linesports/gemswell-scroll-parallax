# Bones pràctiques per construir una web investor scrollytelling

Aquest document recull aprenentatges del procés de creació de la web `gemswell-web-v2`: workflow, decisions que han funcionat, errors comesos i criteris pràctics per futures iteracions.

## 1. Separar projecte, font i publicació

Crear sempre un projecte separat quan es vulgui explorar una versió nova:

- `gemswell-web-v2/` ha de tenir `package.json`, `src/`, `public/` i configuració pròpia.
- No barrejar proves visuals, exports temporals i assets finals dins del mateix nivell de codi.
- Mantenir una carpeta externa per experiments, com `TESTING_PARALLAX/`, per no contaminar el projecte principal.

Error detectat:

- GitHub Pages publicava una branca `gh-pages` antiga, mentre que `main` tenia el codi actual. Això generava diferències entre local i online.

Bona pràctica:

- Configurar GitHub Actions perquè cada push a `main` faci build i deploy automàtic a Pages.
- Validar sempre quin commit i quin build està servint Pages.

## 2. Treballar primer desktop si el projecte ho demana

Si el client demana centrar-se només en desktop:

- Bloquejar decisions de layout al viewport desktop abans d'entrar en mobile.
- Fer QA amb amplades reals: 1440, 1512, 1728 i 1920 px.
- Evitar arreglar problemes de desktop afegint media queries mobile.

Error detectat:

- Algunes decisions inicials intentaven ser massa universals i generaven composicions amb espais buits o jerarquies febles en desktop.

Bona pràctica:

- Definir un `--max` coherent amb la pantalla objectiu.
- Revisar cada secció amb regla visual o DevTools per assegurar que ocupa l'ample disponible quan cal.

## 3. Convertir slides en narrativa, no en rèplica

Una web no ha de ser una successió rígida de slides.

Bona pràctica:

- Reorganitzar el PDF en capítols: overview, platform, Madrid, Birmingham, benchmark, investment, contact.
- Distribuir slides denses en seccions respirades.
- Convertir taules, bullets i diagrames en mòduls interactius o visuals.
- Mantenir tota la informació del PDF, però no necessàriament en el mateix ordre.

Error detectat:

- Algunes seccions van quedar massa literals o amb massa informació en un sol bloc.

Correcció recomanada:

- Per cada slide densa, fer una taula d'inventari:
  - informació obligatòria,
  - informació secundària,
  - asset necessari,
  - possible forma web,
  - risc de densitat.

## 4. Definir una jerarquia tipogràfica abans de maquetar

La jerarquia de text ha de ser consistent:

- H1: només per moments hero o missatges principals.
- H2: títols de capítol.
- H3: títols de secció.
- H4: títols interns de targeta o mòdul.
- Body: text explicatiu.
- Meta/eyebrow: etiquetes petites.

Errors detectats:

- Textos amb mides massa diferents sense funció clara.
- Subtítols que visualment competien amb títols.
- Títols massa grans dins de caixes petites.

Bona pràctica:

- Centralitzar els tokens de font-size al CSS.
- Evitar ajustar cada text manualment si pertany a una mateixa categoria.
- Quan un text no encaixa, primer revisar `max-width`, `line-height`, `grid` i `padding`; no només reduir font-size.

## 5. Maquetació: evitar espais buits sense funció

En webs investor premium, l'espai en blanc és bo només si té intenció.

Errors detectats:

- Columnes amb molta informació a l'esquerra i zones buides a la dreta.
- Títols desconnectats de la caixa o visual que explicaven.
- Cards a diferent alçada sense justificació.

Bona pràctica:

- Cada viewport ha de tenir una lectura clara: què miro primer, segon i tercer.
- Si una columna queda buida, redistribuir:
  - títol,
  - subtítol,
  - imatge,
  - key facts,
  - bullets.
- En grids de dues columnes, alinear visualment els centres, no només els marges.
- Fer servir `align-items`, `grid-template-columns`, `minmax` i `max-width` abans de recórrer a marges arbitraris.

## 6. Assets: qualitat abans d'optimització agressiva

Els assets han de mantenir qualitat visual.

Errors detectats:

- Una imatge vertical va perdre massa resolució en optimitzar-la.
- Alguns logos tenien fons o marcs no desitjats.
- Algunes imatges quedaven "enganxades" al fons per manca de fusió visual.

Bona pràctica:

- Guardar originals d'alta qualitat.
- Crear versions web optimitzades sense destruir detall.
- Verificar cada imatge en el tamany real de render, no només en miniatura.
- Per logos:
  - preferir SVG net,
  - eliminar fons,
  - evitar marcs no intencionals,
  - comprovar que no quedin retallats.

## 7. Fades i transicions visuals

Els fades han d'integrar imatge i fons, no tapar-los de forma brusca.

Errors detectats:

- Fades massa propers al borde real de la imatge, deixant visible el tall.
- Degradats verticals que solapaven massa el contingut.
- Transicions entre capítols massa sobtades.

Bona pràctica:

- Fer que el fade comenci més endins de la imatge quan el borde és visible.
- Aplicar fades als quatre costats només si la imatge ho necessita.
- No aplicar fade al costat on es vol conservar el tall net o l'impacte visual.
- Separar diagrames o contingut important de zones de degradat.
- En transicions entre colors de capítol, usar una banda prou llarga perquè no sembli un tall.

## 8. Dropdowns i cards interactives

Les cards desplegables han de tenir comportament fluid i previsible.

Errors detectats:

- Algunes targetes obrien de cop.
- Alguns contenidors canviaven d'alçada i generaven rebot visual.
- El trigger per scroll no sempre era evident per l'usuari.

Bona pràctica:

- Mantenir el clic com a trigger segur.
- Si es fa servir hover, que reprodueixi el mateix comportament que el clic.
- Fixar alçada mínima o alçada de contenidor quan el canvi de contingut pot fer saltar el layout.
- Animar `grid-template-rows`, `max-height` o `opacity` amb transicions suaus.
- Respectar `prefers-reduced-motion`.

## 9. Charts i dades

Els charts han de ser llegibles i visualment consistents.

Errors detectats:

- Barres amb alçades de referència no alineades.
- Països del bar chart a diferent alçada.
- Contenidors visuals afegits que feien soroll.

Bona pràctica:

- Definir una línia base clara.
- Separar uns píxels la línia guia de l'inici de les barres.
- Mantenir labels i països alineats amb CSS Grid.
- Evitar caixes extra si una línia inferior resol millor la lectura.
- Dades importants sempre dins de mòduls de dades, no codificades aleatòriament dins de JSX llarg.

## 10. Diagrames financers i ownership

Els diagrames han de ser autoexplicatius.

Errors detectats:

- El diagrama KELPA no s'entenia prou sense títol.
- Algunes fletxes i percentatges del PDF original no estaven prou representats al principi.
- Fades del capítol següent solapaven el diagrama.

Bona pràctica:

- Afegir títol visible, no només `aria-title`.
- Preservar percentatges, banderes i escuts quan són part del sentit.
- No fer servir un diagrama decoratiu si ja existeix un altre equivalent a la web.
- Separar el diagrama del canvi de capítol amb espai suficient.
- Fer servir SVG per tenir escalabilitat i control precís.

## 11. Header i navegació

El header ha de ser discret però consistent.

Errors detectats:

- Botó `Source deck` va quedar obsolet.
- Redireccions per anchor deixaven massa espai buit a dalt.
- Border radius inconsistent entre header, botons i altres elements.

Bona pràctica:

- Eliminar accions que ja no tenen funció.
- Ajustar `scroll-margin-top` per cada anchor important.
- Usar un token global per border radius.
- Aplicar el mateix radi a botons, pills, cards i caixes.

## 12. Animació i motion

El motion ha de reforçar la lectura, no competir amb el contingut.

Errors detectats:

- Alguns parallax no eren visibles o no aportaven prou.
- El wordmark animat podia semblar un simple escombrat si no es construïa orgànicament.
- Indicadors petits en loop podien distreure.

Bona pràctica:

- Cada animació ha de tenir una raó narrativa.
- Validar visualment si l'efecte és perceptible en scroll real.
- Evitar microanimacions que no aporten informació.
- Per logos, preferir revelat vectorial o màscares controlades, no live fonts.
- Si una animació no millora la web, treure-la.

## 13. QA visual sistemàtic

Abans de donar per bona una iteració:

- Revisar secció per secció amb DevTools.
- Comprovar overflow lateral.
- Comprovar que no hi ha text tallat.
- Comprovar que cap imatge queda pixelada.
- Comprovar anchors del header.
- Comprovar diferències local vs Pages.
- Fer `npm run build`.

Checklist ràpida:

- La secció ocupa l'ample correcte?
- Hi ha espais buits sense intenció?
- El títol està connectat amb el contingut que descriu?
- Les caixes tenen el mateix radius?
- El text té la mida correcta per la seva funció?
- Els assets són nítids?
- Els fades integren o tapen?
- Les animacions són fluides?
- El contingut del PDF continua present?

## 14. Workflow recomanat per futures webs

1. Crear projecte separat.
2. Inventariar PDF, assets, fonts i brand DNA.
3. Definir narrativa per capítols.
4. Crear jerarquia tipogràfica i tokens.
5. Construir primer desktop.
6. Implementar seccions per mòduls.
7. Convertir dades en arrays o data modules.
8. Fer QA visual per secció.
9. Ajustar anchors, fades i espai.
10. Validar build local.
11. Configurar deploy automàtic.
12. Comparar local amb Pages.

## 15. Regla general del projecte Gemswell

La web ha de sentir-se com una peça investor premium:

- contundent,
- clara,
- visual,
- respirada,
- fidel al contingut financer,
- però no esclava del layout del PDF.

Quan hi hagi conflicte entre fidelitat al PDF i experiència web, cal conservar tota la informació però redissenyar-ne la distribució.
