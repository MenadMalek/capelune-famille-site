# Catalogue Mulberry en français

Le fichier `mulberry-fr.js` contient les libellés français des **3 436 SVG** de la banque Mulberry à la révision `9cbab9f400c5de44e2bc58839cca07294aadb086`.

Les CSV officiels français et anglais ont servi de point de départ. La revue porte sur tous les identifiants : traductions manquantes, traces de noms techniques, verbes à l’infinitif, variantes, métiers, émotions, pays et drapeaux. Les faux amis et différences de sens sont corrigés, par exemple : *honey* → miel, *dates* → dattes, *saw* → scie, *trainers* → baskets, *file* → lime, *coach* → autocar, *mole* → grain de beauté. Des images ambiguës ont également été vérifiées : *cricket* / *cricket_2*, *sweet* / *sweet_2*, *bottom*, *torch*, *bow*, *cornet*, *sole*, *headlamp* et *break_2*.

Les noms propres et les mots qui existent aussi en français (piano, ambulance, sandwich…) conservent leur forme usuelle. Les variantes conservent leur identifiant original, indispensable au chargement des images.

## Recherche et connexion

Le planning et le séquençage chargent le catalogue avant le sélecteur. La recherche utilise les libellés français, ignore la casse et les accents, accepte les pluriels simples et les synonymes courants. Les mots anglais restent recherchables. Aucun service de traduction ne reçoit la recherche.

Le catalogue est intégré à l’application et mis en cache par le service worker. Le téléchargement des images Mulberry nécessite toujours Internet. Les URL des SVG utilisent la même révision que le catalogue : une mise à jour distante ne peut pas ajouter silencieusement des images non traduites. L’ancien index anglais en stockage local n’est plus utilisé. Les données des plannings et des séquences existantes ne sont pas modifiées.

## Vérification et maintenance

Exécuter `node tests/mulberry-fr-check.mjs`. Le contrôle vérifie les 3 436 identifiants par empreinte du manifeste officiel, les libellés non vides, l’absence de noms techniques, des corrections sémantiques et des recherches françaises dans plusieurs domaines. Il vérifie également le chargement du catalogue dans les deux outils, sa mise en cache et l’absence de requête réseau lors de la recherche.

Pour ajouter une nouvelle révision Mulberry, comparer tous les noms SVG, traduire les nouveaux identifiants, revoir les images ambiguës, mettre à jour la révision et l’empreinte du manifeste, puis exécuter les contrôles. Ne pas réintroduire de repli sur le nom anglais comme libellé.

## Sources et licence

- [Mulberry Symbols](https://github.com/mulberrysymbols/mulberry-symbols)
- [CSV français officiel](https://github.com/mulberrysymbols/mulberry-symbols/blob/9cbab9f400c5de44e2bc58839cca07294aadb086/scripts/data/symbol-info-fr.csv)
- [CSV bilingue et catégories](https://github.com/mulberrysymbols/mulberry-symbols/blob/9cbab9f400c5de44e2bc58839cca07294aadb086/scripts/data/symbol-info.csv)

Mulberry © Steve Lee, sous [Creative Commons Attribution – Partage dans les mêmes conditions 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Les adaptations françaises du catalogue réalisées pour Capelune Famille sont mises à disposition sous cette même licence.
