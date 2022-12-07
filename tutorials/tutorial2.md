---
title: TD2 &ndash; Création d'un framework 1/2
subtitle: Faille XSS, Injection SQL, Requêtes préparées, Repositories, Twig, MVC, Framework, Symfony, Injection de dépendances
layout: tutorial
lang: fr
---

## Démarrage

Pour sauvegarder votre progression TD par TD, il est conseillé de recréer un nouveau dossier pour chaque TD et d'y copier le contenu réalisé lors du précédent TD.

A l'aide de PHPStorm créez dond un nouveau projet vide dans le dossier `public_html/TD2` 
de votre répertoire personnel. 
Pour ceci, sélectionnez `New Project`, `PHP Empty Project`, Location: `/home/licence/votre_login/public_html/TD2`.

Copiez le contenu de votre dossier `TD1` dans `TD2`.

Vérifiez que l'URL suivante donne bien accès à votre site : 

[http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/feed.php](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/feed.php).

Attention, dorénavant, il faudra bien vérifier que `TD2` est dans l'URL! (et que vous n'êtes pas revenu sur une URL du TD1 par erreur).

## Un peu de sécurité!

Lors du dernier TD, nous nous étions laissé sur un cliffhanger concernant la sécurité de votre site web... Nous allons maintenant mettre en évidence deux failles majeures auxquelles est sujet **The Feed** et nous allons voir comment les éviter.

### La faille XSS

Actuellement, quand un utilisateur publie un **feedy** via l'application, le contenu est stocké tel quel dans la base et ensuite lu tel quel par l'application, en affichant sa valeur directement dans le code HTML. Ne pensez-vous pas que cela puisse poser un problème...? 

<div class="exercise">

1. Tentez de publier le **feedy** suivant :

   ```html
   <h1>Coucou</h1>
   ```

   Hmmmm bizarre! Continuons!

2. Réitérez l'expérience avec ce nouveau **feedy** :

   ```html
   <iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
   ```

   Quoi ??? Bon, ce n'est pas très grave...continuons!

3. Enfin, essayez de publier le **feedy** suivant , à priori innofensif :

   ```html
   <script type="text/javascript">document.body.innerHTML = "";</script>
   ```

   Que...? Oh non, ce n'est rien, peut-être que ça ira mieux si on recharge la page...?

4. Avant de lire la suite, essayez de comprendre ce qu'il s'est passé.

</div>

Vous venez d'exploiter une faille de sécurité bien connue : La `faille XSS` (pour cross-site scripting). En effet, comme le contenu du **feedy** est affiché tel quel, il est considéré comme du code HTML de la page. Pour un texte simple, pas de soucis, mais si on commence à charger du véritable code HTML (ou pire : javascript!) alors, la page l'éxécutera tel quel et modifiera son affichage en fonction.

Pour règler ce problème, il y a une solution très simple fournie par PHP. Toutes les données textuelles "sensibles" doivent êtres filtrées par la fonction `htmlspecialchars(texte)`. On appelle cette fonction avant d'afficher la donnée en question, et, les caractères "spéciaux" qui pourraient êtres interprétés comme du code HTML sont alors convertis. Ainsi, la page HTML n'exécutera pas le code en question et l'interprétera simplement comme du texte.

<div class="exercise">

1. Modifiez le code générant la page HTML de **The Feed**, afin d'appliquer la fonction ``htmlspecialchars`` sur le message et le nom de l'auteur d'une publication.

2. Tentez de publier de nouveaux **feedies** avec les exemples de tout à l'heure et vérifiez qu'ils ne sont plus intéreprétés comme du code.

</div>

On pourrait également se protéger de la faille en appellant la fonction sur le message lors de l'enregistrement dans la base... En tout cas, il faut y penser, et cela peut devenir rappidement fastidieux! Heureusement, nous verrons très prochainement comment complétement régler ce problème sans avoir à y penser en utilisant un **moteur de template**.

### L'injection SQL

Une seconde faille de sécurité **bien plus dangereuse** est présente sur votre site web!

<div class="exercise">

1. Tentez de publier le **feedy** suivant :

   ```sql
   ', '2023-11-11 00:00:00','anonyme');DELETE FROM Publications;--
   ```

2. Rendez vous dans votre base de données et regardez le contenu de votre table `publications`.

3. Essayez de comprendre ce qu'il s'est passé. Pour vous aider, copiez dans la console SQL de `phpMyAdmin` le contenu de la requête exécuté dans votre fichier `feed.php` et, à la place du message, copiez le contenu du **feedy** que vous avez tenté de publier lors de la première question.

</div>

Vous venez d'expérimenter une faille nommée **l'injection SQL**. Cette faille consiste à faire éxécuter une requête par la base de données en manipulant une donnée qui va lui être transmise et utilisée dans une autre requête. 

Dans le **feedy** que vous avez publié, la première partie du message vient "compléter" toutes les données qui suivent le message dans la requête originale. Ensuite, elle termine la requête (avec le ;) puis **injecte** une requête de supression. Bien sûr, cette partie est insérée à la place du message dans la requête originale...Il reste donc théoriquement toute la partie originale de "droite" qui devrait alors poser problème! Mais ici, cette partie est tout bonnement ignorée grâce au code `--` qui permet de créer un commentaire! La partie de droite est alors commentée et donc, ignorée.

Pour vous donner une meilleur idée de ce mécanisme, voici le contenu de la requête (hormis pour la date qui ne sera pas la même, évidemment) qui a été éxécutée par la base :

```sql
INSERT INTO publications (message, date, loginAuteur) VALUES('', '2023-11-11 00:00:00','anonyme');DELETE FROM Publications;--', '2022:12:07 08:00:00', 'anonyme');
```

On le constate bien ici, la base exécute les deux requêtes et commente toute la partie de droite "originale"!

Cette faille est très dangereuse, car vous pouvez alors éxécuter n'importe quelle requête sur la base! Il est donc possible, par exemple, de mettre à jour son profil et de s'accorder des privilèges administrateur...Ou simplement, comme ici, supprimer tout le contenu du site.

Heureusement, ici aussi, une soltuion existe : Les **requêtes préparées**.

### Requêtes préparées

Une **requête préparée** est une requête pré-compilée séparant la partie **requête** et la partie **donnée**. On définit d'abord la requête en marquant les emplacements où devront se trouver les données ce qui définit un **template**. Quand on souhaite éxécuter la requête avec des valeurs données, on effectue une opération de **bind** qui précise à la requête quelle valeus devront être utilisés pour les différents marqueurs du template de la requête.

Ainsi, il devient impossible d'injecter du code SQL directement dans la requête comme précédent. On peut voir cela comme si on transformait la requête en une fonction compilée et que ses différents marqueurs devenaient alors des paramètres. De plus, il est possible de réutiliser la requête plusieurs fois à la suite de manière optimisée en remplaçant les paramètres (cela sera assez peu le cas dans nos applications PHP, mais cela peut avoir plus d'intérêt avec des langages comme Java (avec l'API JDBC), par exemple).

Avec `PDO`, on peut construire et éxécuter une **requête préparée** ainsi :

```php
$values = [
   "attribut1" => valeur,
   "attribut2" => valeur,
   ...
];

$statement = $pdo->prepare("INSERT INTO nomTable (attribut1, attribut2, ...) VALUES(:attribut1, :attribut2, ...);");
$resultat = $statement->execute($values);
```

* Le tableau `$values` est un tableau associatif qui associe chaque nom d'attribut à sa valeur.

* Dans la requête, les marqueurs sont placés en mettant le symbole `:` suivi du nom de l'attribut.

* Les noms des clés du tableau `$values` doivent correspondre aux noms des marqueurs.

Prenons l'exemple suivant :

```php
$nom = $_POST['nom'];
$prenom = $_POST['prenom'];
$resultat = $statement->query("INSERT INTO Personnes (nom, prenom) VALUES ('$nom', '$prenom')");
```

Cette requête n'est pas préparée, elle est donc vulnérable aux injections SQL. Nous allons la préparer pour éviter le risque lié à cette attaque :

```php
$nom = $_POST['nom'];
$prenom = $_POST['prenom'];
$values = [
   "nom" => $nom,
   "prenom" => $prenom,
];
$statement = $pdo->prepare("INSERT INTO Personnes (nom, prenom) VALUES(:nom, :prenom)");
$statement->execute($values);
```

La requête est maintenant préparée, le risque est alors évité!

Pour une requête **récupérant des donnéees** (SELECT), après éxécution, les données sont directement stockées dans `$statement`.

Enfin, vous pouvez noter qu'il n'est pas nécessairement utile de préparer une requête s'il n'y a pas de données "externes" à palcer dans celle-ci. Ainsi, la requête qui récupère toutes les publications n'a pas nécéssairement besoin d'être préparée. Par sécurité et dans le cas où nous la fassions évoluer dans le futur, nous allons quand même le faire.

<div class="exercise">

1. Transformez la requête qui insère une nouvelle publication dans `The Feed` pour la rendre préparée.

2. Faites de même avec la requête qui sélectionne tous les **feedies**. Comme il n'y a pas de données à passer à la requête, appellez simplement la méthode `execute` sur la requête préparée sans aucun paramètres.

3. Recharger votre page `feed.php`, vérifiez que tout marche toujours bien.

4. Tentez de publier un **feedy** contenant le code de l'injection SQL de l'exercice précédent. Cela ne devrait plus fonctionner et, à la place, le texte de l'inejction devrait s'afficher dans un **feedy**.

</div>

## Repositories

Actuellement, nous mélangeons le code qui permet d'interagir avec la base de données et celui qui permet de générer la page HTML. Ce n'est pas très propre et rend le code lié à la base non réutilisable.

Prochainement, nous allons redesigner toute l'architecture de l'application, mais nous pouvons dejà commencer avec cette partie du code.

Dans le contexte d'une application, un **repository** (repositories au pluriel) est une classe dont le rôle est d'intéargir avec la **source des données** de l'application (qui n'est pas nécessairement une base de données, cela peut aussi être un fichier csv, XML, etc...). Un **repository** est lié à une **entité** bien précise et se charge des opéartions de lecture et d'écriture relatifs à cette entité. 

On utilise une instance d'un repository pour insérer des nouvelles données, les charger, les mettre à jour, ou bien les supprimer. Cet ensemble d'opérations est nommée `CRUD` (**C**reate, **R**ead, **U**pdate, **Delete**). Cela correspond donc à :

   * Create : Insertion d'une nouvelle entité dans la source de données
   * Read : Chargement de toutes les entités ou bien d'une entité précise depuis la source de données
   * Update : Mise à jour d'une entité dans la source de données
   * Delete : Supression d'une entité dans la source de données

Par exemple, si on dispose d'une entité `Personne` qui doit être **persistante**, il y aurait alors une classe `PersonneRepository` avec une méthode pour créer une nouvelle personne, récupérer toutes les personnes, une personne précise, modifier les informations d'une personne et enfin, supprimer une personne donnée.

Bien sûr, un repository peut implémenter plus d'opérations que le `CRUD` (par exemple, "récupérer toutes les personnes habitant à Montpellier"), mais c'est déjà un minimum à implémenter.

### Un repository pour les publications

<div class="exercise">

1. Créez une classe `PublicationRepositorySQL` (donc, dans un fichier `PublicationRepositorySQL.php`) contenant le squelette de code suivant :

   ```php
   class PublicationRepositorySQL
   {
      private PDO $pdo;

      public function __construct(PDO $pdo)
      {
         $this->pdo = $pdo;
      }

      public function getAll() : array {
         $publications = [];

         //TO-DO

         return $publications;
      }

      public function create($publication) {
         //TO-DO
      }
   }
   ```

2. Complétez la méthode `getAll`. Cette méthode récupère toutes les publications auprès de la base et les retourne dans un tableau. Il suffit de déplacer et d'apater une partie de votre code de `feed.php`. Il est important de noter que la classe possède un attribut de type `PDO`.

3. Complétez la méthode `create`. Cette méthode prend une `Publication` en paramètre et l'insère dans la base. Même remarque que précédemment.

4. Dans `feed.php`, importez le fichier `PublicationRepositorySQL.php` avec l'instruction `require_once`.

5. Modifiez votre code pour utiliser votre nouveau **repository** pour insérer et récupérer les publications. Vérifiez que tout fonctionne bien. Vous remarquerez que le constructeur de `PublicationRepositorySQL` attend un objet `PDO` en paramètre.

</div>

### CRUD : Extension du repository

Même si elles ne nous serviront pas dans l'immédiat, il serait bien d'implémenter les méthodes restantes du `CRUD`.

<div class="exercise">

1. Dans la classe `PublicationRepositorySQL`, implémentez la méthode `get($id)` qui permet de récupérer un objet `Publication` dont l'identifiant est passé en paramètre auprès de la base de données.

2. Implémentez la méthode `update($publication)` qui permet de mettre à jour les données d'une publication passée en paramètre auprès de la base de données. Cette méthode sera similaire à `create` mais utilisera la requête SQL `UPDATE`. Pour sélectionner la bonne publication au niveau de la base, il faudra récupérer l'identifiant stocké dans l'objet `$publication`. Nous ne mettrons à jour que le `message` de la publication (à priori, les autres données ne vont pas changer).

3. Implémentez la méthode `remove($publication)` qui permet de supprimer une publication passée en paramètre auprès de la base de données. Même remarque que précédemment pour récupérer l'identifiant.

</div>

Nous n'allons pas tester ces méthodes dans l'immédiat, mais nous y reviendront!

## Installation de votre premier composant : Twig

`Twig` est un **moteur de templates** qui permet de générer tout type de document (pas seulement de l'HTML!) en utilisant des données passées en paramètres. Twig fournit toutes les structures de contrôles utiles (if, for, etc...) et permet de placer les données de manière fluide. Il est aussi possible d'appeler des méthodes sur certaines données (des objets) et d'appliquer certaines fonctions (ou filtres) pour transformer les données (par exemple, mettre en majuscule la première lettre...).

Twig permet également de construire des modèle de templates qui peuvent être étendus et modifiés de manière optimale. Le template va définir des espaces nommés `blocs` qu'il est alors possible de redéfinir indépendamment dans un sous-template. Cela va nous être très utile par la suite!

Il est aussi possible d'installer (ou de définir soi-même) des extensions pour ajouter de nouvelles fonctions de filtrage! On peut aussi définir certaines variables globales accessibles dans tous les templates.

Dans notre contexte, nous utiliserons `Twig` pour générer nos pages HTML car cela présente différents avantages non négligeables :

   * Le langage est beaucoup moins verbeux que du PHP, il est beaucoup plus aisé de placer les données aux endroits désirés de manière assez fluide.
   * En spécifiant un petit paramètre, les pages générées avec `Twig` seront naturellement protégées contre les failles `XSS`! (plus besoin d'utiliser `htmlspecialchars`).
   * Nous allons pouvoir définir des templates globaux pour l'affichage des éléments identiques à chaque page (header, footer, etc...) et ainsi de pas répéter le code à plusieurs endroits.

### Le langage

* L'instruction ```{% raw %}{{ donnee }}{% endraw %}``` permet d'afficher une donnée à l'endroit souhaité (à noter : **les espaces après et avant les accolades sont importants!**). On peut également appeler des méthodes (si c'est un objet) : ```{% raw %}{{ donnee.methode() }}{% endraw %}```. On peut aussi appeler une fonction définie par `Twig` ou une de ses extensions : ```{% raw %}{{ fonction(donnee)) }}{% endraw %}```. Ou bien un filtre, par exemple : ```{% raw %}{{ donnee|upper }}{% endraw %}``` pour passer une chaîne de caractères en majuscule. Il est aussi possible de combiner plusieurs filtres, par exemple ```{% raw %}{{ donnee|lower|truncate(20) }}{% endraw %}```.

* Il est possible de définir une variable locale : 

```twig
{% raw %}
{% set exemple = "coucou" %}
<p>{{exemple}}</p>
{% endraw %}
```

* La structure conditionnelle `if` permet de ne générer une partie du document que si une condition est remplie :

```twig
{% raw %}
{% if test %}
   Code HTML....
{% endif %}
{% endraw %}
```

Il est bien sûr possible de construire des conditions complexes avec les opérateur : `not`, `and`, `or`, `==`, `<`, `>`, `<=`, `>=`, etc... par exemple :

```twig
{% raw %}
{% if test and (not (user.getName() == 'Simith') or user.getAge() <= 20) %}
   Code HTML....
{% endif %}
{% endraw %}
```

* La structure conditionnelle `for` permet de parcourir une structure itérative (par exemple, un tableau) :

```twig
{% raw %}
{% for data in tab %}
   <p>{{ data }}</p>
{% endfor %}
{% endraw %}
```

Si c'est un tableau associatif et qu'on veut accèder aux clés et aux valeurs en même temps :

```twig
{% raw %}
<ul>
{% for key, value in tab %}
   <li>{{ key }} = {{ value }}</li>
{% endfor %}
<ul>
{% endraw %}
```

On peut aussi faire une boucle variant entre deux bornes : 

```twig
{% raw %}
{% for i in 0..10 %}
    <p>{{ i }}ème valeur</p>
{% endfor %}
{% endraw %}
```

Pour créer un `bloc` qui pourra être **redéfini** dans un sous-template, on écrit simplement :

```twig
{% raw %}
{% block nom_block %}
   Contenu du bloc...
{% endblock %}
{% endraw %}
```

Pour **étendre** un template, au début du novueau template, on écrit simplement :

```twig
{% raw %}
{% extends "nomFichier.html.twig" %}
{% endraw %}
```

Par exemple, imaginons le template suivant, `test.html.twig` :

```twig
{% raw %}
<html>
   <head>
      <title>{% block titre %}Test {% endblock %}</title>
   </head>
   <body>
      <header>...</header>
      <main>{% block main %} ... {% endblock %}</main>
      <footer>...</footer>
   </body>
</html>
{% endraw %}
```

Vous pouvez alors créer le sous-template suivant qui copiera exactement le contenu de `test.html.twig` et modifiera seulement le titre et le contenu du main : 

```twig
{% raw %}
{% extends "test.html.twig" %}
{% block titre %}Mon titre custom{% endblock %}
{% block main %} <p>Coucou!</p> {% endblock %}
{% endraw %}
```

Il n'est pas obligatoire de redéfinir tous les blocs quand on étend un template. Dans l'exemple ci-dessus, on aurait pu seulement redéfinir le bloc `main` sans changer le titre de la page, par exemple.

Il est tout à fait possible d'utiliser un bloc de structure à l'intérieur d'un autre bloc de structure. Il est aussi tout à fait possible de créer un bloc rédéfinissable à l'intérieur d'un autre bloc...Il est aussi possible de faire des sous-templates de sous-templater. Voyez ça comme une hiéarchie entre classes! Les blocs sont comme des méthodes de la classe parente qu'il est possible de redéfinir!

Pour en savoir plus sur `Twig`, vous pouvez consulter [La documentation officielle](https://www.branchcms.com/learn/docs/developer/twig).

### Installation

Pour installer `Twig` dans votre application, nous allons utiliser le **gestionnaire de dépendances** `composer`. Il s'agit d'un outil utilisé dans le cadre du développement d'applications PHP pour installer des composants tiers. `Composer` gère un fichier appellé `composer.json` qui référencie toutes les dépendances de votre application. 

Quand on installe une application ou un nouveau composant, `composer` place les librairies téléchargées dans un dossier `vendor`. Il n'est pas nécessaire de versionner ou de transporter ce dossier (souvent volumineux) en dehors de votre environnement de travail. En effet, quand vous souhaiterez installer votre application dans un autre environnement (une autre machine), seul le fichier `composer.json` suffit. Lors de l'installation, ce fichier sera lu et les dépendances seront téléchargées et installées automatiquement.

Pour utiliser `composer`, il faut se placer à la **racine du projet**, là où se trouve (ou se trouvera après l'installation de `Twig`) le fichier `composer.json`.

<div class="exercise">

1. Ouvrez un terminal à la racine de votre projet et éxécutez la commande suivante :

   ```bash
   composer require twig/twig
   ```

2. Attendez la fin de l'instllation. Allez observer le contenu du fichier `composer.json` fraichement créé ainsi que le contenu du dossier `vendor`.
</div>

Quelques tips :

   * Sur une autre machine (ou dans un nouvel environnement), pour installer les dépendances (et donc initialiser le dossier `vendor`), il suffit d'éxécuter la commande :

   ```bash
   composer install
   ```

   * Si vous modifiez le fichier `composer.json` ou que vous souhaitez simplement mettre à jour vos dépendances, vous pouvez éxécuter la commande :

   ```bash
   composer update
   ```

### Autoloading

C'est bon, Twig est installé! Nous allons maintenant l'initialiser. Mais tout d'abord, il faut charger **l'autoloader** de `composer`.

Vous l'aurez constaté, il est assez pénible de devoir appeler l'instruction `require_once` pour utiliser une classe dans un fichier. En plus, cela peut devenir vite compliqué car il faut indiquer le chemin relatif du fichier en question, qu'il faudrait donc changer si on déplace le fichier utilisant la classe en question... (pour l'instant, toutes nos classes sont dans le même dossier, mais cela serait plus complexe dans une application avec différentes **couches** et donc une structures avec plusieurs dossiers). 

Fort heureusement, il existe un sytème similaire aux `packages` et aux `imports` de **Java**. Pour chaque classe, on définit un `namespace` (qui est le "package" où elle se trouve). Enfin, quand on veut utiliser la classe, il suffit de l'improter avec l'instruction `use` en précisant son package. Il n'y a plus à se soucier du chemin réel du fichier. Il faut alors d'indiquer à composer où se situe le package d'entrée (quel dossier) puis, son `autoloader` se chargera de faire les imports nécessaires. Pour utiliser l'autoloading, il suffit de le charger dans le script php utilisé, en indiquant son chemin :

```php
require_once __DIR__ . '/vendor/autoload.php';
```

La variable `__DIR__` permet de récupérer le dossier où se trouve le fichier qui utilise cette variable. Dans notre contexte, le fichier d'autoloading se situe dans le sous-dossier `vendor` par rapport au fichier `feed.php`.

Dans l'immédiat, nous n'en avons pas encore besoin d'autolaoding pour nos propres classes (cela viendra) mais `Twig` lui en a besoin.

`Twig` s'initialise comme suit :

```php
//Au début du fichier, après avoir chargé l'autodloader
use Twig\Environment;
use Twig\Loader\FilesystemLoader;

//On doit indiquer à Twig où sont situés nos templates. 
$twigLoader = new FilesystemLoader(cheminVersDossierTemplate);

//Permet d'échapper le texte contenant du code HTML et ainsi éviter la faille XSS!
$twig = new Environment($twigLoader, ["autoescape" => "html"]);
```

<div class="exercise">

1. Créez un dossier `templates` à la racine de votre projet.

2. Dans votre fichier `feed.php`, chargez l'autoloader de `composer` au tout début.

3. Importez les classes de `Twig` nécéssaires (avec `use`).

4. Initialisez `Twig`. Vous préciserez que les templates se trouvent dans le sous dossier `templates` par rapport au fichier `feed.php`. Vous pouvez pour cela réeutiliser une syntaxe similaire au chemin utilisé pour charger l'autoloader.

5. Rechargez votre page. S'il n'y a pas d'erreurs, c'est que c'est bon! Nous allons maintenant l'utiliser...

</div>

### Un premier template

Vous allez maintenant utiliser un **template** Twig pour réaliser l'affichage de la page principale de **The Feed**.

Pour générer le résultat obtenu via un **template** Twig, il faut éxécuter le code :

```php
//sousCheminTemplate : Correspond au sous-chemin du template à partir du dossier de template indiqué à twig. S'il se trouve à la racine du dossier de templates, on indique alors seulement son nom

// tableauAssociatif : Un tableau associatif de paramètres passés au template. Par exemple si on lui donne ["message" => $test], une variable "message" sera utilisable dans le template twig.

$page = $twig->render(sousCheminTemplate, tableauAssociatif);

//Puis, pour l'afficher comme réponse
echo $page
```

Par exemple, si je veux charger le fichier `personne.html.twig` situé à la racine du dossier `templates` en lui passant un objet Personne en paramètre, je peux faire :

```php
$personne = ...

$page = $twig->render('personne.html.twig', ["personne" => $personne]);
echo $page
```

Bien sûr, on peut passer plusieurs paramètres (il suffit de les ajouter au tableau associatif).

<div class="exercise">

1. Dans le dossier `templates`, créez un fichier nommé `firstFeed.html.twig`.

2. Déplacez le code HTML (mêlé de PHP) permettant de générer la page dans votre nouveau template. Pour rappel, il devrait avoir cette allure :

   ```php
   <!DOCTYPE html>
   <html lang="fr">
      <head>
         <title>The Feed</title>
         <meta charset="utf-8">
         <link rel="stylesheet" type="text/css" href="styles.css">
      </head>
      <body>
         <header>
               <div id="titre" class="center">
                  <a href="feed.php"><span>The Feed</span></a>
               </div>
         </header>
         <main id="the-feed-main">
               <div id="feed">
                  <form id="feedy-new" action="feed.php" method="post">
                     <fieldset>
                           <legend>Nouveau feedy</legend>
                           <div>
                              <textarea minlength="1" name="message" placeholder="Qu'avez-vous en tête?"></textarea>
                           </div>
                           <div>
                              <input id="feedy-new-submit" type="submit" value="Feeder!">
                           </div>
                     </fieldset>
                  </form>
                  <?php foreach ($publis as $publi) { ?>
                     <div class="feedy">
                           <div class="feedy-header">
                              <img class="avatar" src="anonyme.jpg" alt="avatar de l'utilisateur">
                              <div class="feedy-info">
                                 <span><?php echo $publi->getLoginAuteur() ?> </span>
                                 <span> - </span>
                                 <span><?php echo $publi->getDateFormatee()?></span>
                                 <p><?php echo $publi->getMessage() ?></p>
                              </div>
                           </div>
                     </div>
                  <?php } ?>
               </div>
         </main>
      </body>
   </html>
   ```
3. Adaptez ce code pour utiliser le langage de `Twig` à la place, en remplaçant toutes les parties PHP. Vous pouvez considérer qu'un tableau nommé `publications` est passé en paramètre à ce template. 

4. Dans `feed.php` récupérez la page généré par `Twig` en utilisant ce template en passant en paramètres les `publications` récupérées depuis le repository. Affichez cette page avec `echo`.

5. Rechargez la page et observez qu'elle s'affiche toujours bien, mais cette fois, en étant générée par `Twig`!

</div>

### Division des tâches

Dans notre page, on peut distinguer clairement une partie commune qui sera similaire à toutes nos futures pages et une autre partie spécifique à la page courante. :

* La strucutre de base de la page, une partie du head et le header seront communs à toutes les pages

* Le titre de la page et une partie du body seront spécifiques à la page courante.

<div class="exercise">

1. Créez un template `base.html.twig` dans le dossier `templates`.

2. Dans ce template, reprenez tout le contenu du template `firstFeed.html.twig` sauf le `<main>`.

3. Effacez le titre contenu dans `<title>` et à la place, créez un `block` nommé `page_title`.

4. Au tout début du **body**, créez un `block` nommé `page_content`.

</div>

Vous venez de créer le template "de base". Toutes les pages de notre application vont l'étendre afin de posséder la même structure et injecteront leur propre titre et leur propre contenu dans les blocs correspondants.

<div class="exercise">

1. Dans le dossier `templates`, créez un sous-dossier `Publications`.

2. Créez un template `feed.html.twig` dans le dossier `Publications` et faites en sorte qu'il **étende** le template `base.html.twig`.

3. Dans ce template, redéfinissez les `blocks` **page_title** et **page_content** afin d'y placer respectivement le `titre` de la page et le `main` initialement définis dans `firstFeed.html.twig`.

4. Supprimez le template `firstFeed.html.twig`

5. Modifiez `feed.php` afin qu'il génère la page en utilisant le template `Publications/feed.html.twig`.

6. Rechargez votre page et vérifiez que tout fonctionne bien.

</div>

Pour mieux comprendre l'efficacité de ces templates et vérifier que vous savez les mainpuler, vous allez créer une autre page.

<div class="exercise">

1. Dans le dossier `templates`, créez un sous-dossier `Test`.

2. Créez un template `exemple.html.twig` dans le dossier `Test` et faites en sorte qu'il **étende** le template `base.html.twig`.

3. Dans ce template, redéfinissez les `blocks` **page_title** et **page_content** afin d'y placer respectivement le `titre` "Exemple" et un élément HTML `<main> ... </main>` contenant `<p>Coucou!</p>`.

4. A la racine de votre projet, créez un fichier `exempleTemplate.php`.

5. Dans ce fichier, faites en sorte d'afficher la page générée par le template `exemple.html.twig`.

6. Chargez cette page à l'adresse : 

   [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/exempleTemplate.php)](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/exempleTemplate.php) et observez le résultat!

</div>

## Architecture d'une application web

Une **application web** et plus globalement un **logiciel** est organisé selon une architecture précise qui sépare de manière otpimisée les classes et programmes selon leur **rôle**. Différentes architectures sont possibles, mais globalement, on retrouve toujours les mêmes types de rôle.

### Les différentes couches

Peu importe l'architecture mise en place, un logiciel est globalement constitué de **5 couches principales** :

   * La couche **ihm** qui permet de gérer les différentes parties graphiques et surtout l'interaction avec l'utilisateur. Pour une application web cela va correspondre à la partie contenant les **vues**, c'est-à-dire les fichiers responsables de générer le code HTML (et également les ressources javascript, css, etc...)

   * La couche **métier** qui contient le coeur de l'application, à savoir les différentes **entités** manipulées ainsi que des classes de **services** qui permettent de manipuler ces entités et d'implémenter la **partie logique** de votre application.

   * La couche **application** qui permet de faire le lien entre la couche **ihm** et la couche **métier**. Elle contient différents **controllers** dont le rôle est de gérer les **évènements** qui surviennent sur l'interface et d'envoyer des **requêtes** auprès de la couche **métier** et de transmettre les résultats obtenus à **l'ihm**. Dans une application web, les événements sont les requêtes reçues par l'application web (et ses paramètres, via l'URL). Une requête est décomposée puis la bonne méthode du controller est éxécutée avec les paramètres correspondant.

   * La couche **stockage** qui permet de gérer la **persistance des données** à travers une forme de stockage configurée (base de données, fichier...). Son rôle va donc être de sauvegarder et charger les données des différentes entités de la couche **métier**. C'est cette couche qui va contenir les différents **repositories** dont nous avons déjà parlé. Cette couche est généralement utilisée par les différents classes de services. Globalement, les interactions se déroulent dans ce sens : IHM <-> Application <-> Services <-> Stockage.

   * Eventuellement, la couche **réseau** dans le cadre d'une application **client/serveur**. Cette couche va gérer la transmission des données entre deux programmes (avec des sockets, etc...). Dans une application web, il n'y a pas besoin de gérer explicitement cette couche qui est prise en charge par le protocole **HTTP** ou **HTTPS**.

Une bonne architecture logicielle respecte le principe de **faible couplage et forte cohésion**. Cela signifie qu'à l'intérieur d'une couche, il y a beaucoup d'interactions mais que les liens entre les différentes couches sont les plus réduits possibles (le moins de dépendances possibles entre les classes de couches différentes). Globalement, pour les autres couches, ce qui se passe à l'intérieur d'une couche doit presque agir en boîte noire. Dans le cas de la couche **application** par exemple, le point d'entrée de la couche **business** sont les services. Par ailleurs, toutes les couches n'ont pas à se connaitres entre-elles, par exemple, on peut tout à fait concevoir une architecture pù :

   * La couche **ihm** ne connait que la couche **application**

   * La couche **application** ne connait que la couche **métier**

   * La couche **métier** ne connait que la couche **stockage**

   * La couche **stockage** ne connait que la partie "**entités**" de la couche **métier**

### L'architecture MVC - MVCS?

L'architecture `MVC` est une architecture qui permet de séparer les entités, les vues et les controllers de l'application et de les faire communiquer. On retrouve donc une séparation des couches **application** (qui contient les controllers), ihm (vues : fichiers HTML / TWIG) et la partie contenant les **entités** (model) de la couche **métier** que nous avons évoqué.

La vue (le fichier HTML) envoie des requêtes qui sont reçues et traitées par un controller, qui va lui-même interagir avec les entités (charger, sauvegarder, mettre à jour, supprimmer...) avant de générer la vue correspodant à la réponse. On a ainsi un cycle.

Néanmoins, il n'est pas fait mention des **services** dans cette architecture. En fait, dans une architecture `MVC` classique, le **controller** a le rôle des services et effectue une partie de la logique métier. Néanmoins, cela peut vite créer des controllers ayant beaucoup trop de responsabilités en plus du décodage des paramètres de la requête. C'est pourquoi il est possible de venir placer la couche **service** entre les **controllers**, les **entités** et la couche **stockage**. Ainsi, le controller n'effectue pas de logique métier et on a une séparation plus forte.

Ici, la couche **métier** créée donc une séparation entre la partie "model" (**entités**) et les **services** qui manipulent ces entités. Ainsi, les différents **controllers** n'interagissent pas directement avec les entités, mais plutôt avec des **services**. On pourrait qualifier les services de **couche de validaiton**

Dans ce cas, on sort un peu de l'architecture classique `MVC` et on pourrait presque parler de `MVCS` où le `S` désignerait les **services**. Il n'y a pas de règles précise quant à l'utilisaiton de telle ou telle architecture, mais dans le cas de notre application, nous allons plutôt tendre vers une architecture utilisant les services.

Par ailleurs, ce style d'architecture étendant le MVC en utilisant les services est présenté par Microsoft dans [la documentation `MVC` de leur framework `.NET`](https://learn.microsoft.com/fr-fr/aspnet/mvc/overview/older-versions-1/models-data/validating-with-a-service-layer-cs).

### Les composants et phases essentiels d'une application web

Si l'architecure logicielle a une place importante dans le cadre du développement d'une application web, d'autres composants sont aussi essentiels à son bon fonctionnement. Comme nous sommes dans le cadre d'une application **client / serveur**, la partie **cliente** (navigateur web) ne peut pas appeler directement la bonne fonction d'un **controller**. Pour cela, une **requête** est transmise et traitée par l'application côté **serveur** avant de trouver le bon controller et la bonne fonction à éxécuter. Ce mécanisme est appellé le **routing**. On va donc généralement avoir besoin :

   * D'un **point d'entrée** qui est le premier fichier éxécuté lors de la reception d'une requête sur votre application. Son rôle est de récupérer les informations utiles de la requête et de la transmettre à votre application.

   * D'un **routeur**, c'est-à-dire une portion de code qui associe des chemins (des **routes**) à des fonctions sur des controllers bien précis et permet donc d'éxécuter le bon code en se basant sur les données fournies par la requête. Par exemple, on pourrait créer une association : `/product/1/details` => `ProductController` => `getProductDetailsAction($idProduct)`. Le rôle du routeur serait alors de reconnaitre ce chemin quand il est présent dans l'URL d'une requête et d'éxécuter la fonction `getProductDetailsAction` qui renverra un nouveau résultat (une page web, des données...).

   * D'un **résolveur d'arguments** qui permet d'extraire des données fournies dans l'URL de la route. Dans l'exemple précédent, nous avions l'id du produit dans l'URL. Le résolveur doit donc permettre d'extraire cette donnée et de la passer à la fonction getProductDetailsAction. A noter que cela ne concerne pas les données envoyées par les méthodes `GET`, `POST` ou autre, qui sont accessibles dans le corps de la requête.

## Mise en place d'un nouveau projet

Dans cette partie, nous allons mettre un place un nouveau projet en suivant une nouvelle architecture puis nous viendrons y greffer le travail déjà produit sur **The Feed** afin de mettre notre site à niveau.

<div class="exercise">

   1. Déplacez tout le travail effectué jusqu'à présent dans un dossier à l'extérieur du dossier du `TD2` (ou bien dans une archive, à la rigueur). Cependant, conservez le dossier `vendor` et les fichiers `composer.json` et `composer/lock` dans votre espace de travail (dossier du `TD2`). Gardez vos "anciens" fichiers à portée, vous en aurez besoin un peu plus tard.

   2. Dans le dossier du `TD2`, mettez en place l'architecture suivante (**respectez bien les noms et majuscules/minusules!**) :

      📦TD2  
      ┣ 📂config  
      ┣ 📂src  
      ┃ ┣ 📂Application  
      ┃ ┣ 📂Business  
      ┃ ┃ ┣ 📂Entity  
      ┃ ┃ ┗ 📂Services  
      ┃ ┣ 📂Storage  
      ┃ ┃ ┗ 📂SQL  
      ┃ ┗ 📂View  
      ┣ 📂vendor  
      ┣ 📂web  
      ┃ ┗ 📂assets  
      ┣ 📜composer.json  
      ┗ 📜composer.lock  
      
</div>

Quelques notes :

   * Le dossier `src` contient les sources de notre application (le code), on y retrouve les différentes **couches** d'un logiciel. Le dossier `SQL` accueillera des **repositories** pour interagir avec une base de données relationnelle utilisant du SQL. On aurait pu aussi, par exemple, avoir des repositories **XML** ou pour tout autre format de stockage!

   * Le dossier `config` viendra accueillir des fichiers de configruation de notre application (nous y reviendrons).

   * Le dossier `web` représente la partie **publique** de notre application. C'est ici que se trouvera le **point d'entrée** de l'application, c'est à dire le fichier éxécuté quand un utilisateur fait une requête sur notre site. Il contient aussi un dossier `assets` qui contient toutes les ressources chargées par l'application (fichiers css, images, polices, fichiers javascript, etc...). Ces ressource sont publiquement accessibles par le client et sont donc hors de notre application (située dans src) qui elle, est innaccessible (on ne doit pas pouvoir télécharger ou visualiser le contenu des fichiers à l'itnérieur de src, ou de config...).

   * Le dossier **vendor** contient les librairies externes installées (pour le moment, twig) et les fichiers **composer.json** et **composer.lock** permettent de lister ces dépendances.

### Point d'entrée

Nous allons mettre en place le **point d'entrée** de votre application, c'est à dire le fichier éxécuté lorsqu'on souhaite accèder à votre site. Ce fichier est généralement appellé **front controller**. Il reçoit la requpete et la transmet à votre application qui se charge de la traiter (extraire les arguments, analyser la route, trouver le bon controller, la bonne méthode à éxécuter, etc...)

<div class="exercise">

1. Dans le dossier `web`, créez un fichier `app.php` avec le contenu suivant :

   ```php
   <?php

   echo "Coucou!"
   ```

2. Testez que votre point d'entrée fonctionne. Quelle est l'URL à utiliser ?

</div>

Pour des raisons de confort visuel, il serait souhaitable que lorsqu'on navigue sur le site, le `app.php` n'apraisse pas dans l'URL et qu'on y accède directement par `/web`...Pour cela, rien de plus simple, il suffit de rediriger une requête visant le dossier `/web` vers `/web/app.php` et avoir une règle de récriture pour la partie `app.php`.

Tout cela peut se faire à l'aide d'un fichier `.htaccess`. Ce fichier permet de configurer un repertoire se trouvant dans le serveur web. On peut par exemple en itnerdire l'accès, autoriser seulement l'accès à certains fichiers, rediriger des requêtes, réécrire l'URL...

<div class="exercise">

1. Téléchargez [ce fichier `htaccess`]({{site.baseurl}}/assets/TD2/htaccess)

2. Placez-le dans le dossier `web` et renommez-le en `.htaccess`.

3. Ouvrez-le et consulter son contenu. Essayez de comprendre ce qu'il fait, dans les grandes lignes.

4. Maintenant, essayez d'accèder à votre application sans préciser `app.php` dans l'URL. Cela devrait fonctionner!

5. Si cela ne marche pas (avec une erreur, ce qui semble arriver sur les serveurs de l'IUT...) supprimez le fichier `.htaccess` et créez un fichier `index.php` dans le dossier `web` contenant le code suivant :

   ```php
   <?php
   require_once('app.php');
   ```

</div>

### Sources de l'application et autoloading

Plus tôt, nous avons parlé du sytème de chargement des **classes** à partir de leur **namespace**, grâce au mécansime d'**autoloading**. Nous aimerions mettre en place ce même système pour les futures classes de notre application **The Feed**.

Il suffit de préciser à **composer** le dossier correspondant au `namespace` "racine" que nous utiliserons. Tout se passe au niveau du fichier `composer.json` :

```json
{
    "require": {
        "twig/twig": "^3.4"
    },

    "autoload": {
        "psr-4": {
            "NameSpaceRacine\\": "monDossier"
        }
    }
}
```

Ici, dans le bloc `autoload`, on indique à **composer** qu'il doit chercher à partir du dossier `monDossier` quand on utiliser le `namespace` "**NameSpaceRacine**". Par la suite, les `namespace` définis dans des classes qui descendent de ce `namespace` racine (sous-packages) devront respecter les noms des dossiers dans lesquels se trouvent ces classes.

Dans une **classe**, un `namespace`correspond (globalement) au `package` dans laquelle elle se trouve. Il va généralement s'agir da la succession des sous-dossiers à partir du `namespace` "racine".

Une fois l'**autoloading** mis en place, il n'y aura donc plus besoin de faire appel à `require_once` pour charger les **classes**, on utilisera à la place le mote clé `use` avec le `namespace` correspondant.

**Il faut impérativement éxécuter la commande suivante** après l'ajout d'une règle d'autoloading pour que composer la prenne en compte :

```bash
composer update
```

<div class="exercise">

1. Ajoutez une règle d'autoloading dans le fichier `composer.json` afin d'associer le `namespace` **TheFeed** au dossier **src**.

2. Mettez à jour votre espace de travail en éxécutant la commande de mise à jour via **composer**. 

3. Reprenez votre classe `Publication.php` et copiez-là dans `src/Business/Entity`. Au début du fichier, définissez son `namespace` ainsi :

      ```php
      namespace TheFeed\Business\Entity;
      ```

4. Dans `app.php`, il faut en premier lieu charger l'autoloader. Retrouvez la ligne correspondante dans `feed.php` et copiez-là dans `app.php`. Attention, il faudra adapter le chemin (le dosier `vendor` se trouvant un dossier plus haut que `app.php`). Cette ligne doit rester placée avant les premiers imports! 

5. Importez votre classe `Publication` en utilisant le mot clé `use` :

      ```php
      use TheFeed\Business\Entity\Publication;
      ```

6. Tentez de créer une instance de `Publication` dans `app.php`. Rechargez votre page, si vous n'avez pas d'erreur, c'est qu'à priori, cela fonctionne!

7. Reprenez votre classe `PublicationRepositorySQL.php` et copiez-là dans `src/Storage/SQL`. Définissez son namespace (déduisez-le de l'exemple précédent avec `Publication`).

8. Testez l'import de votre classe dans `app.php` et instanciez un objet `PublicationrepositorySQL` sans lui passer de paramètre. Cela devrait déclencher une erreur (quand il attend un objet `PDO`). Vérifiez que c'est bien cette erreur qui est affichée au chargement de la page et pas le fait qu'il n'arrive pas à trouver la classe `PublicationrepositorySQL`.

9. Effacez les imports des deux classes dans `app.php` (c'était juste pour tester que l'autoloading fonctionne bien). En revanche, gardez bien la ligne chargeant l'autoloader. Une fois chargé ici, au niveau du `front controller` (point d'entrée), l'autoloading fonctionnera pour n'importe quel import dans n'improte quel fichier / classes.
</div>

Il est important que l'autoloading est reservé aux **classes** (car elles utilisent un `namespace`). Il n'est pas possible de faire cela pour des fichiers `php` simples (on utilise alors le `require_once`).

## Les frameworks

Un **framework** est une infrastructure logicielle fournissant divers outils et composants afin de mettre en place un projet informatique. Un framework définit un cadre de travail (et donc des règles) pour le développeur afin qu'il puisse développer son application efficacement sans avoir à se soucier des diverses problématiques, notamment liées à l'architecture, l'accès aux services, le routage, le stockage, etc...

Un framework permet donc d'optimiser la mise en place d'un projet. Le code d'un framework est générique et peut être théoriquement appliqué à n'importe quel projet. Il est généralement constitué de plusieurs composants distincts et parfois même de diverses bibliothèques externes. 

La différence fondamentale avec une **librairie** (ou une **API**) c'est que ce n'est pas le développeur qui se sert du code de cette ressource pour son projet mais plutôt le framework qui intègre le code créé par le développeur dans son environnement. C'est un peu comme si le développeur développait un composant qui viendrait alors s'insérer dans le framework.

Pour citer deux célèbres frameworks, on a par exemple :

   * **Symfony** (que vous utiliserez dans le prochain module web) qui est un framework PHP (français!). Ce framework inclut notamment l'ORM **Doctrine** qui permet de gérer la couche de stockage des données assez simplement, et aussi **Twig** pour la gestion des vues...Ce Framework est très vite devenu populaire à travers le monde, et il est particulièrement utilisé dans les SSII du secteur de Montpellier!

   * **Spring**, qui est un framework Java. Là aussi, on retrouve un ORM pour la gestion des données : **Hibernate**.

Vous l'aurez compris, utiliser un **framework** permet d'optimiser au mieux le développement d'un projet en obligeant le développeur à respecter le cadre de travail défini. Les frameworks utilisent divers **design patterns** pour gérer l'architecture des projets  et l'accès aux composants. Généralement, un framework bien construit amène naturellement le développeur à utiliser ces patterns (parfois sans s'en rendre compte!).

### Mise en place de votre propre framework

L'utilisation du framework se fait quasiment en "boîte noir", c'est-à-dire que le développeur n'a pas besoin de savoir comment il foncitonne en interne (c'est globalement un avantage qui rend donc ces frameworks très accessibles). Néanmoins, il semble intéressant, dans le cadre de ce  cours et avant que vous utilisez ce genre d'outil, de **construire votre propre framework** afin de réellement comprendre comment ils fonctionnent.

Le but va donc être de créer le code de cet outil, de manière générique et réeutilisable pour de futurs projets. Pour se faire, nous allons justement utiliser différents composants externes qui vont nous aider à construire notre framework (Twig, des briques de Symfony, etc...).

<div class="exercise">

   1. Commencez par installer les divers composants dont vous allez avoir besoin pour cosntruire votre framework (twig est normalement déjà installé) :

      ```bash
      composer require symfony/http-foundation symfony/routing symfony/http-kernel symfony/dependency-injection
      ``` 

   2. Créez un dossier `external` à la racine de votre projet (dans le dossier `TD2` donc) puis, à l'intérieur de ce dossier, un repertoire `Framework`.

   3. Dans le fichier `composer.json`, ajoutez une règle d'autoloading (dans le bloc `psr-4`) qui associe le namespace `Framework` au dossier `external/Framework`.

   4. Exécutez la commande composer de mise à jour (update) pour qu'il prenne en compte cette nouvelle règle.

</div>

### Un premier controller et des routes

Vous allez créer votre premier **controller** contenant des actions et des **routes** pour y accèder.

Dans les fonctions définies dans votre **controller**, il faudra renvoyer un objet **Response** contenant une chaîne de caractères (correspondant, normalement, au code HTML de la page à rendre, même si nous travaillerons sur des exemples simples pour ces premiers tests). Nous y reviendrons plus tard, mais cette objet constitue en fait la réponse renvoyée au navgiateur web après une requête.

<div class="exercise">

   1. Dans le répertoire `src/Application` créez un **controller** nommé `TestController`. Donnez-lui le `namespace` adéquat.

   2. Importez la classe `Response` :

   ```php
   use Symfony\Component\HttpFoundation\Response;
   ```

   2. Créez une fonction `bonjour` qui renvoie une `Response` contenant une chaîne de caractère "bonjour".

   3. Créez une fonction `additionneur` qui prend deux paramètres `$a` et `$b` et renvoie une `Response` contenant chaîne de caractère sous la forme "Resultat = (la somme des $a et $b)".

   4. Créez une fonction `afficheInfos` qui prend en paramètre un objet `Request $request`. Attention, **il faut bien préciser le type** (nous verrons pourquoi plus tard). Cet objet contient les données de la requête, notmament les données passées dans la requête (via GET, POST,etc...). Vous avez accès à une méthode `get` qui permet de récupérer ces données (en précisant leur nom). Faites en sorte que cette fonciton :

      1. Récupère une donnée `nom` et une donnée `prenom` stockée dans les données de la requête.

      2. Renvoie une `Reponse` contenant une chaîne de caractères "Vous vous appellez nom prenom" (en remplaçant nom et prenom avec les données récupérées, bien entendu)

      Attention, il vous faudra **importer la classe Request** dans votre controller :

   ```php
   use Symfony\Component\HttpFoundation\Request;
   ```

</div>

Maintenant que nous avons quelques actions, il nous faut créer les routes pour y accèder! Pour cela, nous allons nous aider du **composant de routing** de Symfony.

Le fonctionnement de ce composant est assez simple :

   * On initialise un objet `RouteCollection` dont le rôle est d'enregistrer et gérer toutes les routes de notre application.

   * On crée un onjet `Route` en spécifiant :

      * Le chemin de la route (à partir de la racine de notre site), par exemple `/products`, `/users/login`...On peut aussi spécifier des **paramètres** dans le chemin qui seront lus lors du décodage de la route et transmis au controller. Il faut alors que la fonction prenant en charge l'action dans le controller possède un paramètre du même nom. Par exemple : `/products/{id}`. Ici, le chemin possède un paramètre `id`. Les routes correspondantes peuvent donc être `/products/0`, `/products/1`, etc...De son côté, la fonction correspondate dans le **controller** devra possèder un paraètre `$id`. Il est bien sur possibles de préciser plusieurs paramètres à divers endroits du chemin.

      * Le **controller** (en utilisant son namespace, comme pour importer sa `classe`) et le nom de la `fonction` à éxécuter. Ces deux éléments sont séparés par `::`. Par exemple, on pourrait avoir : `MyApp\\Application\\MyController::maFonction` (donc, la fonction `maFonction` du controller MyController).

      * Des valeurs par défaut pour les éventuels paramètres définis dans le chemin.

   * Il faut ensuite ajouter la route dans la **collection de routes** en l'associant avec un **nom**.

   Tout cela peut se résumer avec deux exemples :

   ```php
   use Symfony\Component\Routing\Route;
   use Symfony\Component\Routing\RouteCollection;

   $routes = new RouteCollection();

   $firstRoute = new Route("/hello", [
      "_controller" => "MyApp\\Application\\HelloController:hello" //Le _ devant "controller" est important.
   ]);

   $routes->add('hello_world', $firstRoute);

   $secondRoute = new Route("/products/{id}", [
      "_controller" => "MyApp\\Application\\ProductController:details" //La fonction "details" doit avoir un paramètre $id!
      "id" => 0 // Valeur par défaut...non obligatoire!
   ]);

   $routes->add('product_details', $secondRoute);
   ```

   Par défaut (avec ce que nous allons construire) l'objet `Request` contenant les données de la requête est automatiquement transmis à la fonction du controller qui va s'éxécuter si celle-ci précise un paramètre de type `Request`. On ne le précise donc pas au niveau des routes.

<div class="exercise">

   1. Dans `app.php`, instanciez un objet `RouteCollection`.

   1. Créez une route qui met en lien le chemin `/` avec la fonction `bonjour` du controller `TestController`. Ajoutez-là à la collection de routes.

   2. Créez une route qui met en lien le chemin `/addition/{a}/{b}` avec la fonction `additionneur` du controller `TestController`. Les paramètres `a` et `b` ne devront pas avoir de valeurs par défaut. Ajoutez-là à la collection de routes.

   3. Créez une route qui met en lien le chemin `/infos/personne` avec la fonction `afficheInfos` du controller `TestController`. Ajoutez-là à la collection de routes.

</div>

### La classe principale du framework

Nous avons notre **controller** et nos **routes** mais rien pour les faire fonctionner...C'est-à-dire, un bout de code qui puisse permettre de traiter la requête reçue de manière à identifier la route correspondante, extraire les éventuelles données et donc éxécuter la bonne fonction sur le bon controller (avec les bons paramètres!).

Encore une fois, quelques composants et classes de Symfony vont pouvoir nous aider :

   * Un **URL Matcher** : permet d'identifier la route correspondant au chemin visé par l'URL dans un ensemble de routes. On va s'en servir pour spécifier les informations relatives à la route dans les attributs de la requête.

   * Un **résolveur de controller** : permet de récupérer la focntion du controller à utiliser, à partir de la requête.

   * Un **résolveur d'arguments** : permet de récupérer les valeurs des paramètres à passer à la fonction du controller à éxécuter. C'est ce composant qui va notamment permettre de récupèrer les éventuels paramètres spécifiés dans le chemin de la route. Il va également ajouter la requpete elle-même aux paramètres (utile pour récupérer les données dans le corps de la requête transmis par un formulaire, via GET, POST, etc...).

En utilisant ces trois composants, on peut donc récupérer à partir de la requête la fonction à appeler et les paramètres à lui donner. Il suffit alors d'utiliser la fonction PHP : `call_user_func_array($fonction, $parametres)`. Le paramètre `$fonction` est un objet de type `callable`, c'est à dire quelquechose qui peut être appellé, comme une fonction. `$parametres` correspond à un tableau associatif associant chaque nom de paramètre à une valeur. Cette fonction appelle donc la fonction désigné par `$fonction` en lui passant les paramètres définis dans `$parametres`.

Dans notre cas, cette fonction appellera donc une action définie dans un `controller` qui renverra un objet `Response` (contenant, normalement, le code HTML de la page à renvoyer). On peut également y spécifier un **code de réponse** qui indique le **status** de la requpete (success, not found, etc...). Par défaut, si on ne précise rien, le code `200` est utilisé (success == tout va bien).

Dans le cadre de notre **Framework**, nous allons regroupper tout cela dans une classe `AppFramework` qui se chargera de reçevoir une requête, trouver la bonne focntion à éxécuter, récupérer la réponse de l'action déclenchée et la retourner. Notre application se chargera ensuite de transmettre la réponse au client.

<div class="exercise">

1.  Créez une classe `AppFramework` dans le répertoire `Framework` avec ce contenu :

```php
<?php

namespace Framework;

use Exception;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Controller\ArgumentResolver;
use Symfony\Component\HttpKernel\Controller\ControllerResolver;
use Symfony\Component\Routing\Exception\ResourceNotFoundException;
use Symfony\Component\Routing\Matcher\UrlMatcher;

class AppFramework
{
   private $urlMatcher;
   private $controllerResolver;
   private $argumentResolver;

   public function __construct(
      UrlMatcher $urlMatcher,
      ControllerResolver $controllerResolver,
      ArgumentResolver $argumentResolver
   )
   {
      $this->urlMatcher = $urlMatcher;
      $this->controllerResolver = $controllerResolver;
      $this->argumentResolver = $argumentResolver;
   }

   public function handle(Request $request): Response
   {
      //Met à jour les informations relatives au contexte de la requête avec la nouvelle requête traitée
      $this->urlMatcher->getContext()->fromRequest($request);
      try{
            $request->attributes->add($this->urlMatcher->match($request->getPathInfo()));

            $controller = $this->controllerResolver->getController($request);
            $arguments = $this->argumentResolver->getArguments($request, $controller);

            $response = call_user_func_array($controller, $arguments);
      } catch (ResourceNotFoundException $exception) {
            $response = new Response("Page introuvable!", 404);
      } catch (Exception $exception) {
            $response = new Response("Erreur : {$exception->getMessage()}", 500);
      }
      return $response;
   }

}
```

2. Avant de passer à la suite, analysez ce code et essayez d'identifier toutes les étapes que nous avons mentionné précédemment.

3. Essayez de comprendre ce que font les deux clauses `catch` du bloc `try/catch`.

4. Vérifiez vos réponses avec votre chargé de TD.

</div>

Bien, vous avez maintenant de quoi traiter la requête! Il ne reste plus qu'à remodeler le fichier `app.php` afin qu'il puisse instancier la classe `AppFramework` et traiter la requête avec.

<div class="exercise">

   1. Importez les classes nécessaires dans votre fichier `app.php`. Attention, la ligne chargeant l'autoloader doit rester en place, avant les imports! :

   ```php
   use Symfony\Component\HttpFoundation\Request;
   use Symfony\Component\HttpKernel\Controller\ArgumentResolver;
   use Symfony\Component\HttpKernel\Controller\ControllerResolver;
   use Symfony\Component\Routing\Matcher\UrlMatcher;
   use Symfony\Component\Routing\RequestContext;
   use Framework\AppFramework;
   ```

   2. Pour pouvoir instancier l'**URLMatcher**, il faut lui donner en paramètres la **collection des routes** ainsi qu'un objet ``RequestContext`` qui permet de stocker diverses informations utiles sur la requête courante. Commencez donc par instancier un nouvel objet ``RequestContext`` puis, instancier un objet `URLMatcher`.

   3. Instanciez un nouveau `ControllerResolver` ainsi qu'un `ArgumentResolver` (pas de paramètres nécessaires...)

   4. Instanciez un objet `AppFramework` en utilisant les trois objets créés précédemment.

   5. Il faut maintenant récupérer l'objet `Request` à donner à notre framework. Utilisez la fonction **statique** `Request::createFromGlobals()` qui permet de récupérer cet objet. Elle va notamment se servir de toutes les données stockées dans les variables globales gérées par PHP. Nous avions brièvement parlé de ces variables lors du dernier TD (`$_GET`, `$_POST`, ...), mais il en existe plein d'autres (`$_FILES`, `$_COOKIE`, ...). La variable globale `$_SERVER` contient d'ailleurs diverses informations utiles (en-têtes, le chemin demandé...).

   6. Traitez la requête avec l'objet correspondant à notre framework et récupérez l'objet `Response` retourné.

   7. Supprimez la ligne `echo "Coucou"` et éxécutez la méthode `send` sur l'objet `Reponse` récupéré à la question précédente. Cette méthode permet simplement d'envoyer la réponse (par exemple, une page HTML, des données JSON...) au client (navigateur ayant émis la requête, par exemple).

   8. Testez vos routes! Par exemple :

      * [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/)

      * [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/addition/5/3](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/addition/5/3)

      * [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/infos/personne?nom=smith&prenom=john](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/addition/infos/personne?nom=smith&prenom=john)

   9. Comprenez-vous comment et pourquoi vous obtenez ces résultats (notamment pour la dernière question). Si oui, passez àa la suite, si non, appellez votre chargé de TD. Essayez de retracer les étapes effectuées à partir de la reception de la requête jusqu'à l'envoi de la réponse.

   10. Comprenez vous la différence entre le **query string** (comme dans le troisième exemple de test de route de la question 8) et le **passage de paramètres via l'URL d'une route**?

</div>

### Limiter les méthodes d'une route

Actuellement, quand nous créons une **route**, il est possible de la "déclencher" avec n'importe quel méthode HTTP : GET, POST mais également certaines que nous n'avons pas encore utilisé : PUT, PATCH, DELETE...En effet, le controller ne peut pas faire la différence quand il récupère une donnée dans l'objet `Request` avec la methode `get`. Néamoins, il est tout à fait possible d'iniquer qu'une route n'est accessible qu'avec certaines méthodes.

Pour cela, après avoir créé un objet `Route`, il suffit d'utiliser cette fonction :

```php
$route->setMethods([..., ..., ...]);
```

Comme vous pouvez le constater, cette fonction prend un tableau en entrée. Ce tableau contient simplements le nom des méthodes autorisés sous la forme de chaînes de caractères. Par exemple :

```php
//N'autorise que la méthode "GET" et la méthode "PUT" sur cette route
$route->setMethods(["GET", "PUT"]);
```

Si on souhaite éxécuter deux actions différentes pour deux méthodes différentes pour une même route, il faut créer deux routes avec le même chemin et limiter les méthodes autorisées. Par exemple :

```php
$firstRoute = new Route("/test", [
   "_controller" => "MyApp\\Application\\HelloController:bonjourGet"
]);
$firstRoute->setMethods(["GET"]);

$secondRoute = new Route("/test", [
   "_controller" => "MyApp\\Application\\HelloController:bonjourPost"
]);
$secondRoute->setMethods(["POST"]);
```

<div class="exercise">

1. Limitez vos routes ayant pour chemin `/` et `/addition/{a}/{b}` à la méthode `GET`.

2. Limitez votre route ayant pour chemin `/infos/personne` à la méthode `POST`.

3. Testez d'accèder à :  
   [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/infos/personne?nom=smith&prenom=john](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD2/infos/personne?nom=smith&prenom=john)  
   Que se passe-t-il? Pourquoi?

4. Changez la limitation de la route précédente à la méthode `GET`.

</div>

## Conclusion

Nous avons maintenant les bases de notre framework! Dans le prochain TD, nous allons voir comment ajouter et rendre disponnibles différents composants grâce à **l'injection de dépendances**. Ensuite, nous mettrons à niveau notre application : `The Feed`. Enfin, nous améliorerons les possibilités offertes par notre Framework.