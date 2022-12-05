---
title: TD1 &ndash; Introduction à PHP & Persistance des données
subtitle: Hello World, objets, formulaires, BDD, PDO, SQL
layout: tutorial
lang: fr
---

## IDE pour PHP

PHP est un langage de programmation donc utilisez un environnement de
développement. Vous ne codez pas du Java avec BlocNotes, c'est pareil pour
PHP. Nous coderons donc notre PHP sous **PhpStorm**.

* Si vous êtes à l'IUT sous Linux, vous trouverez l'installation dans `/opt/phpstorm/`. Pour le lancer :

    ```bash
    ~/RepertoireCourant$  cd /opt/phpstorm/bin
    /opt/phpstorm/bin$  ./phpstorm.sh
    ```

* Si vous utilisez votre propre machine :

   * sur Ubuntu le plus simple pour installer l'IDE c'est d'utiliser _Snap_, qui est un système de distribution de logiciels simplifié et qui est pré-installé sur toutes les versions récentes d'Ubuntu. À partir d'un terminal tapez :

      ```bash
      sudo snap install phpstorm --classic
      ```

   * sur Windows, Mac OS, ou Linux on peut faire l'installation depuis un exécutable. Suivez les instructions de la 
   [documentation de PhpStorm](https://www.jetbrains.com/help/phpstorm/installation-guide.html#standalone).

   Pour Linux, la documentation vous dit 
   * de [télécharger l'archive](https://www.jetbrains.com/phpstorm/download/),
   * de l'extraire dans un endroit qui va bien (dans votre `$HOME` par exemple)    
      ```bash
      tar -xzf PhpStorm-***.tar.gz --directory ~/
      ```
   * et de lancer l'exécutable se trouvant dans le répertoire `PhpStorm-***.tar.gz/bin/`. Depuis un terminal :
      ```bash
      cd ~/PhpStorm-***/bin/
      ./phpstorm.sh
      ```

#### Nouveau projet

Quand vous ouvrez PhpStorm, créer un nouveau projet vide dans le dossier `public_html/TD1` 
de votre répertoire personnel. 
Pour ceci, sélectionnez `New Project`, `PHP Empty Project`, Location: `/home/licence/votre_login/public_html/TD1`.

#### Obtention de la licence académique Ultimate pour PhpStorm

Pour obtenir une licence académique, remplissez [ce formulaire](https://www.jetbrains.com/shop/eform/students) en utilisant votre adresse universitaire pour bénéficier d'une licence académique.

Quelques minutes après, vous recevrez un email de confirmation suivi d'un second email d'activation où vous devrez accepter les conditions d'utilisation et choisir un nom d'utilisateur et un mot de passe. Conservez précieusement ces informations, car c'est grâce à elles que vous pourrez importer votre licence sur toutes les machines que vous allez utiliser (chez vous, à l'IUT etc).

#### Documentations de PhpStorm

* [Documentation officielle en anglais](https://www.jetbrains.com/help/phpstorm/quick-start-guide-phpstorm.html)
* [Documentation à l'IUT de Intellij Idea](https://gitlabinfo.iutmontp.univ-montp2.fr/dev-objets/TP2) (proche de PhpStorm)

#### Autre IDE

Si vous le souhaitez fortement, vous pouvez aussi utiliser d'autres IDE. 
VSCode est une bonne alternative, mais il manque des fonctionnalités PHP. 
Notez cependant que nous n'assurons pas le support d'autres IDE.  

## Accédez à vos pages web

L'IUT dispose d'un serveur web permettant de faire tourner vos applications PHP et de 
les rendre accessibles depuis l'extérieur. Pour cela, il suffit de déposer vos fichiers
et repertoires dans le repertoire **public_html** accessible depuis votre dossier
personnel.

Le point d'entrée est alors le suivant : [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/)

### Une page HTML de base

<div class="exercise">


1. Créez une page **page1.html** avec le contenu suivant et enregistrez la dans
le répertoire **public_html/TD1** de votre espace personnel.

   ```html
   <!DOCTYPE html>
   <html lang="fr">
       <head>
            <meta charset="utf-8"/>
           <title> Insérer le titre ici </title>
       </head>
   
       <body>
           Bonjour!
       </body>
   </html>
   ```
   Pour ne pas que votre **public_html** devienne une décharge de pages Web à ciel
   ouvert, pensez bien à créer des répertoires les TDs. Nous vous
   conseillons donc de bien suivre la consigne et d'enregistrer `page1.html` dans
   `.../public_html/TD1/page1.html`. Globalement, pour chaque TD, vous devrez
   créer un repertoire correspondant et travailler à l'intérieur.

1. Ouvrez cette page dans le navigateur directement en double-cliquant dessus
   directement depuis votre gestionnaire de fichiers.
   Notez l'URL du fichier :
   [file://chemin_de_mon_compte/public_html/TD1/page1.html](file://chemin_de_mon_compte/public_html/TD1/page1.html).

2. Au lieu d'accèder à votre page en ouvrant le fichier par le navigateur, accèdez-y 
   en utilisant l'URL correspondant au serveur web de l'IUT ([http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/...acompleter](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/...acompleter)).

   **Aide : Votre page ne s'affiche pas ?**  
   Si votre page ne s'affiche pas, c'est peut-être un problème de droit.  Pour
   pouvoir servir vos pages, le serveur HTTP (Apache) de l'IUT doit avoir le
   droit de lecture des pages Web (permission `r--`) et le droit de traverser
   les dossiers menant à la page Web (permission `--x`). À
   l'IUT, la gestion des droits se fait par les ACL.  
   Pour donner les droits à l'utilisateur www-data (Apache), utilisez la commande
   `setfacl` dans un terminal sous Linux :

   ```bash
   # On modifie (-m) récursivement (-R) les droits r-x
   # de l'utilisateur (u:) www-data
   setfacl -R -m u:www-data:r-x ~/public_html
   # On fait de même avec des droits par défaut (d:)
   # (les nouveaux fichiers prendront ces droits)
   setfacl -R -m d:u:www-data:r-x ~/public_html
   ```

   **Note :** Les ACL permettent d'avoir des droits spécifiques à plusieurs
   utilisateurs et à plusieurs groupes quand les droits classiques sont limités
   à un utilisateur et un groupe. Pour lire les droits ACL d'un fichier ou
   dossier, on tape `getfacl nom_du_fichier`.

</div>

### Notre première page PHP

<div class="exercise">

4. Créez une page `public_html/TD1/echo.php` avec le contenu suivant.
   ```php
   <!DOCTYPE html>
   <html>
       <head>
           <meta charset="utf-8" />
           <title> Mon premier php </title>
       </head>
   
       <body>
           Voici le résultat du script PHP : 
           <?php
             // Ceci est un commentaire PHP sur une ligne
             /* Ceci est le 2ème type de commentaire PHP
             sur plusieurs lignes */
           
             // On met la chaine de caractères "hello" dans la variable 'texte'
             // Les noms de variable commencent par $ en PHP
             $texte = "hello world !";

             // On écrit le contenu de la variable 'texte' dans la page Web
             echo $texte;
           ?>
       </body>
   </html> 
   ```

5. Ouvrez cette page dans le navigateur directement depuis votre gestionnaire de
fichiers OU de façon équivalente avec une URL en `file://` comme :  
[file://chemin_de_mon_compte/public_html/TD1/echo.php](file:///home/licence/mon_login_IUT/public_html/TD1/echo.php).

   **Que se passe-t-il quand on ouvre un fichier PHP directement dans le navigateur ?**  
   **Pourquoi ?**

6. Ouvrez cette page dans le navigateur dans un second onglet en passant par le
   serveur HTTP de l'IUT :  
   [http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/echo.php](http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/echo.php)

   **Que se passe-t-il quand on demande un fichier PHP à un serveur HTTP ?**  
   **Regardez les sources de la page Web (Clic droit, code source ou `Ctrl-U`)
     pour voir ce qu'a vraiment généré PHP**.  

</div>

## Les bases de PHP

### Différences avec Java

2. Le code PHP doit être compris entre la balise ouvrante `<?php` et la balise fermante `?>`
2. Les variables sont précédées d'un `$`
1. Il n'est pas obligatoire de déclarer le type d'une variable (cf. plus loin dans le TD)

### Les chaînes de caractères

Différentes syntaxes existent en PHP ; selon les délimiteurs que l'on utilise,
le comportement est différent.

#### Avec guillements simples

Les chaînes de caractères avec ***simple quote* `'`** sont conservées telles
quelles (pas de caractères spéciaux `\n`...). Les caractères
protégés sont `'` et `\` qui doivent être échappés avec un anti-slash comme ceci
`\'` et `\\`;

La concaténation de chaînes de caractères se fait avec l'opérateur point `.`  
```php?start_inline=1
$texte = 'hello' . 'World !';
```

#### Avec guillements doubles

Pour simplifier le code suivant
```php?start_inline=1
$prenom="Helmut";
echo 'Bonjour ' . $prenom . ', ça farte ?';
```

PHP propose une syntaxe de chaîne de caractères entourées de ***double quotes* `"`**
qui permet d'écrire  

```php?start_inline=1
$prenom="Helmut";
echo "Bonjour $prenom, ça farte ?";
```

Les chaînes de caractères avec ***double quotes* `"`** peuvent contenir :
* des variables (qui seront remplacées par leur valeur),
* des sauts de lignes,
* des caractères spéciaux (tabulation `\t`, saut de ligne `\n`).
* Les caractères protégés sont `"`, `$` et `\` qui doivent être échappés avec
un anti-slash `\` comme ceci : `\"`, `\$` et `\\`;

**Astuce :** Pour éviter tout problèmes avec le remplacement de variables, 
rajoutez des accolades autour de la variable à remplacer. Cela marche aussi 
bien pour les tableaux `"{$tab[0]}"`, les attributs `"{$objet->attribut}"` 
et les fonctions `"{$objet->fonction()}"`.

Par exemple :

```php?start_inline=1
$prenom="Helmut";
echo "Je m'apelle {$prenom}, et je suis né le {$dateNaissance->format('d F Y')}";
```   

**Documentation :**
[Les chaînes de caractères sur PHP.net](http://php.net/manual/fr/language.types.string.php)

<div class="exercise">
Qu'écrivent chacun des `echo` suivants ?

```php?start_inline=1
$prenom = "Marc";

echo "Bonjour\n " . $prenom;
echo "Bonjour\n $prenom";
echo 'Bonjour\n $prenom';

echo $prenom;
echo "$prenom";
```

Testez votre réponse en rajoutant ce code dans `echo.php`.

</div>

### Affichage pour le débogage

Les fonctions `print_r` et `var_dump` affichent les informations d'une variable
et sont très utiles pour déboguer notamment les tableaux ou les objets.  
La différence est que `print_r` est plus lisible car `var_dump` affiche plus de
choses (les types).


### Les tableaux associatifs

Les tableaux en PHP peuvent aussi s'indexer par des entiers ou des chaînes de caractères :

* Pour initialiser un tableau, on utilise la syntaxe

  ```php?start_inline=1
  $utilisateur = array(
   'prenom' => 'Juste',
   'nom'    => 'Leblanc'
  );
  ```

  ou la syntaxe raccourcie équivalente

  ```php?start_inline=1
  $utilisateur = [
   'prenom' => 'Juste',
   'nom'    => 'Leblanc'
  ];
  ```

* On peut ajouter des cases à un tableau :

  ```php?start_inline=1
  $utilisateur['passion'] = 'maquettes en allumettes';
  ```

  **Note :** Le tableau `$utilisateur` contient plusieurs associations. Par
    exemple, il associe à la chaîne de caractères `'prenom'` la chaîne de
    caractères `'Juste'`.  
  Dans cette association, `'prenom'` s'appelle la **clé** (ou **index**) et
`'Juste'` la **valeur**.

* On peut rajouter facilement un élément "à la fin" d'un tableau avec

  ```php?start_inline=1
  $utilisateur[] = "Nouvelle valeur";
  ```

* Notez l'existence des boucles
  [`foreach`](http://php.net/manual/fr/control-structures.foreach.php) pour
  parcourir les paires clé/valeur des tableaux. 

  ```php?start_inline=1
  foreach ($monTableau as $cle => $valeur){
      //commandes
  }
  ```

  La boucle `foreach` va boucler sur les associations du tableau. Pour chaque
  association, `foreach` va mettre la clé de l'association dans la variable
  `$cle` et la valeur dans `$valeur` puis exécuter les commandes.
  Par exemple

  ```php?start_inline=1
  foreach ($utilisateur as $cle => $valeur){
      echo "$cle : $valeur\n";
  }
  ```
  
  va afficher ceci (ou l'inverse car l'ordre des entrées n'est pas assuré)
  
  ```
  prenom : Juste
  nom : Leblanc
  passion : maquettes en allumettes
  0 : Nouvelle valeur
  ```
  
  **Remarque :** La boucle `foreach` est indispensable pour parcourir les
  indices et valeurs d'un tableau indexé par des chaînes de caractères.  
  Il existe aussi bien sûr une boucle `for` classique si le tableau est indexé
  uniquement par des entiers

  ```php?start_inline=1
  for ($i = 0; $i < count($monTableau); $i++) {
      echo $monTableau[$i];
  }
  ```

  Pour comprendre `foreach` autrement, le code suivant

  ```php?start_inline=1
  foreach ($monTableau as $cle => $valeur){
      //commandes
  }
  ```

  est équivalent à
  
    ```php?start_inline=1
  for ($i = 0; $i < count(array_keys($monTableau)); $i++) {
      $cle = array_keys($monTableau)[$i];
	  $valeur = $monTableau[$cle];
      //commandes
  }
  ```


**Source :** [Les tableaux sur php.net](http://php.net/manual/fr/language.types.array.php)

<!-- ### Les structures de contrôle -->

<!-- Syntaxe alternative -->
<!-- http://php.net/manual/fr/control-structures.alternative-syntax.php -->

### Exercices d'application

<div class="exercise">

1. Dans votre fichier `echo.php`, créez trois variables `$login`, `$message`
   contenant des chaînes de caractères de votre choix.

2. Créez la commande PHP qui écrit dans votre fichier le code HTML suivant (en
   remplaçant bien sûr le login par le contenu de la variable `$login`, etc...) :

   ```html
   <p> jsmith : Bonjour tout le monde! </p>
   ```

3. Faisons maintenant la même chose mais avec un tableau associatif `messages`:

   * Créez un tableau `$messages` contenant deux clés `"login"`, `"message"` 
   et les valeurs de votre choix ;

   * Utilisez l'un des affichages de débogage (*e.g.* `var_dump`) pour vérifier
     que vous avez bien rempli votre tableau ;

   * Affichez le contenu du "message-tableau" au même format HTML 

   ```html
   <p> jsmith : Bonjour tout le monde! </p>
   ```

4. Maintenant nous souhaitons afficher une liste de messages :

   * Créez une liste (un tableau indexé par des entiers) `$messages` de quelques
     "messages-tableaux" ;

   * Utilisez l'un des affichages de débogage (*e.g.* `var_dump`) pour vérifier
     que vous avez bien rempli  `$messages` ;

   * Modifier votre code d'affichage pour écrire proprement en HTML un titre
     "Liste des messages :" puis une liste (`<ul><li>...</li></ul>`) contenant les informations
     des messages.

   * Rajoutez un cas par défaut qui affiche "Il n'y a aucun messages." si la
     liste est vide.  
     (On vous laisse chercher sur internet la fonction qui teste si un tableau est vide)

</div>

<div class="exercise">

1. Créez un fichier `table.php` contenant deux variables `$nombreTable` et `$limite`
qui contiendront des nombres.

2. Reprenez le squelette HTML de `echo.php` (hors contenu du body) afin d'avoir 
une page HTML valide.

3. Affichez la table de multiplication du nombre contenu `$nombreTable` en s'arrêtant à `$nombreTable x $limite` sous la forme d'une liste HTML (chaque multiplication étant contenu dans un 
élément `<li>...</li>`)

   Exemple avec `$nombreTable = 3` et `$limite = 4` :

   ```html
   <ul>
      <li> 3 x 0 = 0 </li>
      <li> 3 x 1 = 3 </li>
      <li> 3 x 2 = 6 </li>
      <li> 3 x 3 = 9 </li>
      <li> 3 x 4 = 12 </li>
   </ul>
   ```

</div>

## La programmation objet en PHP

Tout au long des TDs, nous allons nous affairer à la construction d'un site de type 
**réseau social** appellé '**The Feed**'. Ce site contiendra un fil principal appellé
`feed` qui permettra de consulter les derniers `feedies` (publications) postés. Plus tard,
d'autres foncitonnalités viendront se rajouter : commentaires, utilisateurs connectés,
achat via l'application, api...

Nous allons reprendre, en partie, ce que vous avez déjà fait dans `echo.php`.

PHP était initialement conçu comme un langage de script, mais est passé Objet à partir de la
version 5. Plutôt que d'utiliser un tableau, créons une classe pour nos **publications**.

### Un exemple de classe PHP

<div class="exercise">

1. Créer un fichier **Publication.php** avec le contenu suivant

   ```php
   <?php
   class Publication {
   
       private $idPublication;
       private $message;
       private $date; //Date de publication
       private $loginAuteur;
   
       // un getter      
       public function getMessage() {
           return $this->message;
       }
   
       // un setter 
       public function setMessage($message) {
           $this->message = $message;
       }
   
       // un constructeur
       public function __construct(
         $idPublication,
         $message,
         $loginAuteur
      ) {
           $this->idPublication = $idPublication;
           $this->message = $message;
           $this->date = new DateTime();
           $this->loginAuteur = $loginAuteur;
       } 
   }
   ?>
   ```

   Notez les **différences avec Java** :

   * Pour accéder à un attribut ou une fonction d'un objet, on utilise le `->`
     au lieu du `.` de Java.
   * En PHP, `$this` est obligatoire pour accéder aux attributs et méthodes d'un objet.
   * On doit mettre le mot-clé `function` avant de déclarer une méthode
   * Le constructeur ne porte pas le nom de la classe, mais s'appelle
     `__construct()`.
   * En PHP, on ne peut pas avoir deux fonctions avec le même nom, même si elles
     ont un nombre d'arguments différent. En particulier, il ne peut y avoir au
     maximum qu'un constructeur.
   * Dans le constructeur, nous avons directement utilisé la directive `new DateTime()` pour
     la date de publication. Par défaut, cet objet est initialisé avec la date du jour. 

2. Créez des *getter* et des *setter* pour `$idPublication`, `$date` et `$loginAuteur` ;  
   (PhpStorm peut les générer automatiquement pour vous avec Clic droit > Generate)

3. Testez que votre classe est valide pour PHP : la page générée par le serveur
   Web `webinfo` à partir de `Publication.php` ne doit pas afficher d'erreur.  
   **Demandez donc** votre page à `webinfo`
   [http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/Publication.php](http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/Publication.php).

</div>

### Utilisation de la classe `Publication`

Nous allons commencer à construire **The Feed** en nous servant de la classe `Publication.php` fraichement
créée. Comme nous allons utiliser cette classe dans un autre scrit `feed.php`, il faut l'inclure dans ce dernier pour pouvoir l'utiliser.

#### Require

PHP a plusieurs façons d'inclure un fichier :

* `require "dossier/fichier.php"` : inclut et exécute le fichier spécifié en
   argument, ici `"dossier/fichier.php"`. Autrement dit, tout se passe comme si
   le contenu de `fichier.php` avait été copié/collé à la place du `require`.  
   Renvoie une erreur si le fichier n'existe pas.

* `require_once "dossier/fichier.php"` : fait de même que `require` mais la différence est que si le
  code a déjà été inclus, il ne le sera pas une seconde fois.  
  Ceci est particulièrement utile pour inclure une classe car cela assure qu'on
  ne l'inclura pas deux fois.

Notez qu'il existe `include` et `include_once` qui ont le même effet mais
n'émettent qu'un warning si le fichier n'est pas trouvé (au lieu d'une erreur).

#### Exercice

<div class="exercise">

1. Créez un fichier **feed.php** contenant le squelette HTML classique (`<html>`,`<head>`,`<body>` ...)

2. Dans la balise `<body>`, on va vouloir créer des objets `Publication` et les afficher :

   * Incluez `Publication.php` à l'aide de `require_once` comme vu précédemment ;

   * Initialisez une variable `$publication1` de la classe `Publication` avec la même
     syntaxe qu'en Java. Attention, il ne faut pas passer la date en paramètre (elle est initalisée 
     par votre constructeur). Pour l'identifiant, donnez en un quelconque, pour le login et 
     le message, mettez ce qui vous fait plaisir. 

   * Toujours dans le `<body>`, affichez les informations de la publication (dans une `<div>`, par exemple).

3. Testez votre page sur `webinfo` :  
   [http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/feed.php](http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/feed.php). Une erreur devrait se produire. Essayez de la comprendre par vous-même avant de passer à la suite.

4. Comme vous l'aurez probablement compris, l'erreur vient du fait que la **date de publication** est un objet
   et n'est pas représentable par une chaîne de caractère, en l'état. Pour cela, il faut utiliser la méthode
   `format` de cet objet pour lui indiquer comment on souhaite qu'elle s'affiche.

      * La méthode `format` prend en paramètre une chaîne de cacractère contenant des options d'affichage et renvoie une chaîne de caratère correspondant à lo'affichage souhaité. 
      Par exemple, le code suivant indique de formater la date en **Nom du jour de la semaine, Année** :

      ```php
      $date->format('D, Y');
      ```
5. Les options qui nous intéressent sont : `d` (numéro du jour), `F` (nom du mois) et `Y` (année). Dans `feed.php`, faites en sorte que la date de la publication s'affiche correctement (en mode **Jour NomMois Annee**).

   * Plus d'options de formatage peuvent être trouvées [ici](https://www.php.net/manual/en/datetime.format.php)

6. Dans votre classe `Publication.php`, ajoutez une méthode `getDateFormatee()` qui renvoie une châine de caractères correspondant à l'affichage de la date tel que défini à la question précédente. Dans `feed.php`, utilisez cette méthode à la place d'appeller directement `format` sur la date de votre publication.

</div>

### Déclaration de type

<div class="exercise">
Optionnellement, on peut déclarer les types de certaines variables PHP :
* les arguments d'une fonction
* la valeur de retour d'une fonction
* les attributs de classe

Ces types sont vérifiés à l'exécution, contrairement à Java qui les vérifie à la compilation.  
La déclaration de type est **cruciale** pour que l'IDE devine correctement le type des objets et pour que vous puissiez bénéficier pleinement de l'**autocomplétion** de l'IDE. 

Exemple:
```php
class Requete {
  // Déclaration de type d'un attribut
  string $url;
  string $methode; // GET ou POST
}
class Reponse {
  int $code; // 200 OK ou 404 Not Found
  string $corps; // <html>...
}

// Déclaration de type d'un paramètre de fonction (Requete)
// et d'un retour de fonction (Reponse)
function ServeurWeb(Requete $requete) : Reponse {
   // Corps de la fonction ...
}
```

[Documentation PHP](https://www.php.net/manual/fr/language.types.declarations.php)

1. Mettez à jour `Publication.php` pour déclarer `idPublication` comme `int`, `message` et `login` comme `string` et `date` comme `DateTime` dans
   * les attributs de classes,
   * les arguments des setters,
   * les sorties des getters,
   * les arguments du constructeur,

   **Note :** Pour pouvoir utiliser les déclarations de type, il faut indiquer à PhpStorm que vous voulez utiliser la version 8.1 du langage PHP. Pour ceci, cliquez en bas à droite de l'IDE sur `PHP: *.*` pour basculer vers `PHP: 8.1` (vous pouvez utiliser une version antérieure, mais il faut qu'elle soit au minimum à `7.4`).

2. Testez que PHP vérifie bien les types : dans `feed.php`, appelez une fonction qui attend en argument un `string` en lui donnant à la place un tableau (le tableau vide `[]` par exemple). Vous devez recevoir un message comme suit

   ```
   PHP Fatal error:  Uncaught TypeError: Publication::__construct(): Argument #1 ($message) must be of type string, array given
   ```
</div>

### Plusieurs publications

<div class="exercise">

1. Dans `feed.php`, créez plusieurs publications avec le contenu que vous souhaitez. Stockez les dans un tableau.

2. A l'aide d'une boucle `foreach`, faites en sorte d'afficher ces publications.

</div>

### Un peu de style!

<div class="exercise">

Nous allons un peu stylyser la page `feed.php`. Le but de ce cours n'étant pas de retravailler les notions **HTML/CSS** que vous devez déjà maîtriser, nous vous donnerons le code des différents éléments permettant
de stlyser (un minimum) la page.

1. Remplaçez la partie **HTML** de `feed.php` par le code suivant :

   ```html
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

               </div>
         </main>
      </body>
   </html>
   ```

2. Commez vous pouvez le constater, la page attend un fichier `styles.css` contenant les différentes règles
de style de la page. [Téléchargez-le ici]({{site.baseurl}}/assets/TD1/styles.css) et placez-le dans votre dossier `TD1`.

3. Rechargez la page `feed.php` pour observer le résultat.

</div>

<div class="exercise">

Nous allons maintenant gérer la représentation des publciations appellées `feedies` (au singulier, un `feedy`).

1. Le code HTML d'un `feedy` est le suivant :

   ```html
   <div class="feedy">
      <div class="feedy-header">
         <img class="avatar" src="anonyme.jpg" alt="avatar de l'utilisateur">
         <div class="feedy-info">
            <span>Utilisateur</span>
            <span> - </span>
            <span>01 Novembre 2022></span>
            <p>Je viens de rejoindre The Feed!</p>
         </div>
      </div>
   </div>
   ```

   * Ce code affiche l'image de profil de l'utilisateur. Pour l'instant, nous ne gérons pas encore cet aspect du site, nous utiliserons donc une image par défaut [téléchargable ici]({{site.baseurl}}/assets/TD1/anonyme.jpg). Placez-là dans le dossier `TD1`.

   * Faites en sorte d'afficher les données de chaque publication (chaque `feedy`) que vous avez créé dans `feed.php` en utilisant le code HTML présenté ci-dessus. 

2. Rechargez la page et vérifiez que tout fonctionne bien. Parfois, pour prendre en compte les modifications de style effectuées sur une page, il faut dire au navigateur de vider le cache et recharger les pages de styles. Cela peut se faire en utilisant le raccourci `CTRL+F5`.

</div>

## Interaction avec un formulaire

<div class="exercise">

1. A l'intérieur de l'élément `<div>` d'identifiant `feed` ajoutez le code du **formulaire** suivant :

   ```html
   <form id="feedy-new" action="feed.php" method="get">
      <fieldset>
         <legend>Nouveau feedy</legend>
         <div>
            <textarea minlength="1" placeholder="Qu'avez-vous en tête?"></textarea>
         </div>
         <div>
            <input id="feedy-new-submit" type="submit" value="Feeder!">
         </div>
      </fieldset>
   </form>
   ```

   * L'élément `<form>` permet d'envoyer une requête HTTP vers le serveur en contenant les données saisies par l'utilisateur dans le formulaire.

   * L'attribut `action` spécifie l'adresse de la ressource vers laquelle era envoyé la requête. Ici, on a spécifié une adresse relative `feed.php`. La requête sera donc envoyée sur [http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/feed.php](http://webinfo.iutmontp.univ-montp2.fr/~mon_login/TD1/feed.php)

   * L'atribut `method` permet de spécifier la méthode d'envoie des données : `get` (à travers l'URL) ou `post` (incorporées dans la requête).

   * Les différents champs du formulaire doivent spécifier un attribut `name` pour qu'ils soient envoyés dans la requête et donc récupérables sous le même nom côté serveur.

   * L'attribut `placeholder` de `<input>` (ou ici, `<textarea>`) sert à écrire une valeur par défaut pour aider l'utilisateur.

   * L'input de type **submit** permet de créer un bouton déclenchant l'envoi du forumlaire.

2. Spécifiez l'attribut `name` du champ de saisie de message en lui donnant le nom `message`.

3. Rentrez un message dans le champ de saisie et envoyés le formulaire (avec le bouton "**Feeder!**"). Observez l'URL.
   
   * Comment sont transmises les informations ? 
   * Comment s'appelle la partie de l'URL contenant les informations ?

</div>

Maintenant, nous allons faire en sorte que le message rentré dans le champ de saisie apparaisse comme **feedy** dans la page.

Côté serveur, une fois la requête envoyée, les valeurs sont accessibles au travers d'un tableau associatif indexé par les noms des données (correspondant à l'attribut `name` des éléments du formulaire). Ce tableau est donc accessible dans un script PHP.

Le tableau est différent selon la méthode utlisée. Dans le cas de `get` il s'agit du tableau `$_GET` et pour `post`, le tableau `$_POST`.

Par exemple, si on considère le formulaire suivant :

```html
<form action='exemple.php' method='get'>
   <label for="first">Prenom :</label>
   <input id="first" type='text' name="prenom">
   <label for="last">Nom :</label>
   <input id="last" type='text' name="nom">
   <input type="submit" value="Envoyer">
</form>
```

Une fois envoyé, dans le script `exemple.php`, on pourra accèder au prénom et au nom ainsi :

```php
$prenom = $_GET["prenom"];
$nom = $_GET["nom"];
```

Si on utilise à la place la méthode `post`, on change donc de tableau :

```php
$prenom = $_POST["prenom"];
$nom = $_POST["nom"];
```

<div class="exercise">

1. Afin d'éviter que les données du formulaire n'apparaissent dans l'URL, modifiez 
   le formulaire pour qu'il appelle la méthode POST :

   ```html
   <form id="feedy-new" action="feed.php" method="post">
   ```
2. Dans `feed.php` :

   1. Récupérez le message envoyé par le formulaire de création d'un nouveau feedy.

   2. Créez un nouvel objet `Publication`. Spécifiez un identifiant quelconque, 
   le login `'anonyme'` et le message récupéré via le formulaire.

   3. Ajoutez votre nouvelle publication dans le tableau des publications à afficher.

3. Testez votre formulaire et constatez que votre nouveau **feedy** est bien affiché.

4. Essayez de retrouver l'information envoyée par le formulaire avec les outils de développement (`F12` puis `Onglet Réseau`).

</div>

## Persistance des données

Comme vous l'aurez sans doute remarqué, après rechargement de la page, le **feedy** que vous avez
créé en utilisant le formulaire disparait. En effet, en l'état, cette donnée est éphémère
car elle n'est sauvegardée nul part. Pour remédier à cela, nous allons assurer la **persistance**
de ces données en utilisant une **base de données MySQL** reliée à notre application.

Le rôle de cette base sera de permettre de sauvegarder (puis de charger) les différents objets manipulés
par notre application (pour l'instant les objets "Publication", mais plus tard, d'autres objets viendront). 

### Les bases de PhpMyAdmin

<div class="exercise">
1. Connectez vous à votre base de données MySQL, à l'aide de l'interface
PhpMyAdmin
[http://webinfo.iutmontp.univ-montp2.fr/my](http://webinfo.iutmontp.univ-montp2.fr/my)
Le login est votre login IUT et votre mot de passe initial votre numéro INE.  


2. Changez votre mot de passe (Page d'accueil > Paramètres généraux > Modifier le mot de passe) et reconnectez-vous.
   Si vous n'arrivez pas à vous
   connecter après avoir changé le mot de passe, essayer avec un autre navigateur
   ou bien videz le cache du navigateur (`Ctrl+F5`).


   **Attention :** N'utilisez pas un de vos mots de passe usuels, car
   nous allons bientôt écrire ce mot de passe dans un fichier qui sera sans
   doute vu par le professeur ou votre voisin.  
   Donc vous avez deux possibilités :

   * (**recommandé**) Créez un mot de passe aléatoire à l'aide de
     [https://www.random.org/passwords/](https://www.random.org/passwords/) par
     exemple. Écrivez dès maintenant ce mot de passe dans un fichier.
   * Ou choisissez quelque chose de simple et de pas secret.

2. Créez une table `publications` (sans majuscules) possédant 4 champs :

   * `idPublication` de type `INT` défini comme la clé primaire (Index : `Primary`) 
      et en mode auto-increment (case `A_I`).
   * `message` de type `TEXT`.
   * `date` de type `DATETIME`.
   * `loginAuteur` de type `VARCHAR` d'une longueur maximum de 20.

   **Important :** Pour faciliter la suite du TD, mettez à la création de toutes
     vos tables `InnoDB` comme moteur de stockage, et `utf8_general_ci` comme
     interclassement (c’est l’encodage des données, et donc des accents,
     caractères spéciaux...).

   **Attention** : Les noms des champs sont comme des noms de variables, ils ne
   doivent pas contenir d'accents. Par ailleurs, et contrairement à Oracle,
   MySQL est sensible à la casse (minuscules/majuscules).
   
3. Insérez des données en utilisant l'onglet `Insérer` de PhpMyAdmin. Pour l'instant,
   dans `loginAuteur` mettez systmétiquement le login `anonyme`.

4. Pensez à systématiquement tester vos requêtes SQL dans
   PhpMyAdmin avant de les inclure dans vos pages PHP.

</div>

### Fichier de configuration en PHP

Pour avoir un code portable, il est préférable de séparer les informations du
serveur du reste du code PHP.

<div class="exercise">

1. Créez un fichier `Conf.php`. Ce fichier contiendra une classe
   `Conf` possédant une **constante** `database` comme suit
   (changez bien sûr les `a_remplir`).
   
   **Notes :**

   * Qu'est-ce qu'une **constante** ?

   ```php
   <?php
   class Conf {
   
     const database = array(
       // Le nom d'hote est webinfo a l'IUT
       // ou localhost sur votre machine personelle
       // 
       // ou webinfo.iutmontp.univ-montp2.fr
       // pour accéder à webinfo depuis l'extérieur
       'hostname' => 'a_remplir',
       // A l'IUT, vous avez une BDD nommee comme votre login
       // Sur votre machine personelle, vous devrez creer une BDD sur phpMyAdmin
       'database' => 'a_remplir',
       // A l'IUT, c'est votre login
       // Sur votre machine personelle, vous avez surement un compte 'root'
       'login' => 'a_remplir',
       // A l'IUT, c'est votre mdp (INE par defaut)
       // Sur votre machine personelle, vous avez creez ce mdp a l'installation (ou rien par défaut avec XAMPP)
       'password' => 'a_remplir'
     );
   }
   ?>
   ```
</div>

### Se connecter à la base : L'objet `PDO`

Pour se connecter à une base de données en PHP on utilise une classe fournie
avec PHP qui s'appelle `PDO`
([Php Data Object](http://php.net/manual/fr/book.pdo.php)). Cette classe va nous
fournir de nombreuses méthodes très utiles pour manipuler n'importe quelle base
de donnée.

Pour créer la connexion à notre base de donnée, il faut utiliser le
[constructeur de `PDO`](http://php.net/manual/fr/pdo.construct.php) de la
façon suivante
   
 ```php?start_inline=1
$pdo = new PDO("mysql:host=$hostname;dbname=$databaseName",$login,$password);
```

Le code précédent a besoin que les variables `$hostname`,
`$databaseName`, `$login` et `$password` contiennent les chaînes
de caractères correspondant à l'hôte, au nom, au login et au mot de
passe de notre BDD. Ces informations sont récupérables à l'aide de 
la constante définie dans la classe `Conf`.

Pour avoir plus de messages d'erreur de `PDO` et qu'il gère mieux l'UTF-8, 
on peut utiliser le code suivant :

```php?start_inline=1
// Connexion à la base de données            
// Le dernier argument sert à ce que toutes les chaines de caractères 
// en entrée et sortie de MySql soit dans le codage UTF-8
$pdo = new PDO("mysql:host=$hostname;dbname=$databaseName", $login, $password,
                     array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));

// On active le mode d'affichage des erreurs, et le lancement d'exception en cas d'erreur
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

Nous allons gérer l'accès à cet objet en utilisant un **design pattern** appellé **Singleton**.

Ce pattern permet de s'assurer qu'il n'existe qu'une seule instance d'une classe donnée (et que tout le monde utilise donc la même instance) 
sans pour autant utiliser massivement les attributs et fonctions de classes (*static*) qui compliquent la mise en place de tests unitaires.

Le principe du pattern **Singleton** est le suivant :

1. On écrit la classe comme d'habitude, sans tenir compte du fait qu'il n'y aura qu'une instance.

2. On rend le constructeur de la classe privé (s'il n'y en a pas, on en créé un vide). Cela à pour effet d'interdire l'instanciation en dehors de la classe.

3. On créé un attribut **static** (attribut de classe) du type de la classe et nommé **instance**.

4. On affecte directement cet attribut à **null**.

5. On créé une méthode **static** (méthode de classe) nommée **getInstance** qui vérifie si l'attribut **instance** est **null**, si c'est le cas, on l'instancie 
(autorisé car dans la classe). Typiquement, ce bout de code ne sera éxécuté qu'une fois, lors du premier accès à l'instance. 
Ensuite, dans tous les cas, on renvoie simplement l'instance.

Ainsi, de l'extérieur, dès qu'on veut accèder à l'instance (unique) de la classe, on fait : **NomClasse::getInstance()**.

<div class="exercise">
	
1. Créez une classe `ConnexionMySQL.php` contenant :
   * un attribut `private $pdo`,
   * un constructeur (sans paramètres) initialisant l'attribut $pdo (en faisant en sorte d'avoir les messages d'erreurs et la gestion de l'UTF-8).
   * un accesseur (getter) `getPdo()` à l'attribut `$pdo` (à générer avec PhpStorm).
	
2. Appliquez le pattern **Singleton** à cette classe.

</div>

### Des publications persistantes

Enfin, nous allons rendre nos publications persitantes et ainsi rendre **"The Feed"** un peu plus dynamique!

Voyons donc comment les objets `PDO` servent à effectuer des requêtes
SQL. Nous allons nous servir de deux méthodes fournies par `PDO` :

1. La [méthode `query($SQL_request)`](http://php.net/manual/fr/pdo.query.php) de
la classe `PDO`
   * prend en entrée une requête SQL (chaîne de
   caractères)
   * et renvoie la réponse de la requête dans une représentation interne pas
     immédiatement lisible
     ([un objet `PDOStatement`](http://php.net/manual/fr/class.pdostatement.php)).

2. La
   [méthode `fetch()`](http://php.net/manual/fr/pdostatement.fetch.php)
   de la classe `PDOStatement` s'appelle sur les réponses de requêtes et renvoie
   la réponse de la requête dans un format lisible par PHP. Plus précisément,
   elle renvoie une entrée SQL formatée comme un tableau. Ce tableau est indexé par les noms
   des champs de la table de données, et aussi par les numéros des champs. 
   Les valeurs du tableau sont celles de l'entrée SQL.
   
La
[méthode `fetch($fetchStyle)`](http://php.net/manual/fr/pdostatement.fetch.php)
s'appelle sur les réponses de requêtes et renvoie
la réponse de la requête dans un format lisible par PHP. 
Le choix du format se fait avec la
[variable `$fetchStyle`](http://php.net/manual/fr/pdostatement.fetch.php#refsect1-pdostatement.fetch-parameters). Les formats les plus communs sont :

* `PDO::FETCH_ASSOC` : Chaque entrée SQL est un tableau indexé par les noms
   des champs de la table de la BDD ;

* `PDO::FETCH_NUM` : Chaque entrée SQL est un tableau indexé par le numéro de la colonne 
   commençant à 0 ;

* `PDO::FETCH_BOTH` (valeur par défaut si on ne donne pas d'argument `$fetchStyle`) : 
   combinaison de `PDO::FETCH_ASSOC` et `PDO::FETCH_NUM`.
   Ce format retourne un tableau indexé par les noms de colonnes 
   et aussi par les numéros de colonnes, commençant à l'index 0, comme retournés dans le jeu de résultats

* `PDO::FETCH_OBJ` : Chaque entrée SQL est un objet dont les noms d'attributs
   sont les noms des champs de la table de la BDD ;

* `PDO::FETCH_CLASS` : De même que `PDO::FETCH_OBJ`, chaque entrée SQL est un
   objet dont les noms d'attributs sont les noms des champs de la table de la
   BDD. Cependant, on peut dans ce cas spécifier le nom de la classe des
   objets. Pour ce faire, il faut avoir au préalable déclaré le nom de la
   classe avec la commande suivante :

   ```php?start_inline=1
   $pdoStatement->setFetchMode( PDO::FETCH_CLASS, 'class_name');
   ```

   **Note :** Ce format qui semble très pratique a malheureusement un comportement problématique :
   * il crée d'abord une instance de la classe demandée (sans passer par le constructeur !) ;
   * il écrit les attributs correspondants aux champs de la BDD (même s'ils sont privés ou n'existent pas !) ;
   * **puis** il appelle le constructeur *sans arguments*.

Dans les TDs, nous vous recommandons d'utiliser au choix :
* le format par défaut `PDO::FETCH_BOTH` en appelant `fetch()` sans arguments,
* le format `PDO::FETCH_ASSOC` pour ne pas avoir de cases redondantes (*e.g* `idPublication` et `0`).  
  Dans ce cas, appelez `$pdoStatement->setFetchMode(PDO::FETCH_ASSOC)` avant d'appeler `fetch()`.
  
<div class="exercise">

1. Sur `phpMyAdmin` ajoutez quelques publications dans la table.

2. Dans `feed.php`, supprimez les lignes qui instancient les publications à afficher sur la page et commentez temporairement le code gérant la recepetion des
données du formulaire.

3. Dans votre classe `Publication.php`, remplacçez votre constructeur par un constructeur vide, sans paramètres. En effet, on ne récupère pas forcément tous les attributs 
à chaque requête ce qui empêche d'avoir un constructeur fixe. Dans un premier temps, l'objet sera donc initalisé de manière "vide" puis 
les résultats issus de la base seront alors affectés par des setters.

4. Modifiez `feed.php` afin de récupérer dans la base les publications à afficher (en utilisant, bien sûr, `ConnexionMySQL`, son objet `PDO` et une requête SQL).

	* Toutes les publications doivent êtres récupérées et triées de manière décroissante selon la date de publication (afin d'afficher la plus récente en premier).
	
	* Avec FETCH_BOTH (ou FETCH_ASSOC), il faudra donc instancier chaque publication et se servir des **setters** avec les valeurs obtenues dans le tableau.

   * Attention, la date récupérée dans la base est une **chaîne de caractères**. Il faut donc la convertir en `DateTime` pour la stocker dans un objet `Publication`. Pour cela, il suffit d'appeller le constructeur de `DateTime` prenant en paramètre une chaîne de caractères : `new DateTime($dateChaine)`

5. Rafraichissez votre page et vérifiez que les publications s'affichent bien.

</div>

<div class="exercise">

1. Dans `Publication.php` créez une méthode **static** `create` qui prend en paramètre **message** et **loginAuteur**. 
Cette méthode doit :
	
	* Créer un nouvel objet de type **Publication**.
	
	* Affecter ses attributs **message** et **loginAuteur** avec les paramètres de la méthode.
	
	* Initialier la date de la publication avec la date courante.
	
	* Renvoie cet objet.

	Cette méthode sert de substitut au concstructeur qui est monopolisé pour les opérations liées à la base de données 

	Nous aurions pu gérer cela en créant plusieurs constructeurs, malheureusement, comme nous l'avons vu, PHP ne l'autorise pas.

	L'identifiant sera géré automatiquement par la base de données (auto-increment).

	Nous nous servirons de cette méthode **create** exclusivement pour l'opération impliquant la création d'une nouvelle publication.
	Les arguments doivent donc êtres alignés avec ce qui est demandé au niveau du formulaire.

	Depuis **PHP 8**, il aurait été possible de faire autrement avec des **arguments nommés**. Cette technique consiste 
	à donner des noms à certains paramètres de fonctions. Lors de l'appel à la fonction, on peut donc spécifier un nom 
	de paramètre sans se soucier de sa position. Une autre technique permet de donner des valeurs par défauts à certains arguments.
	L'idée est alors de combiner ces deux techniques pour gérer différentes versions du constructeur en nommant chaque paramètre et 
	en leur donnant la valeur **null** par défaut. Néamoins, cette méthode pourrait rendre le code assez illisible et "fourre-tout".
	Il n'est généralement pas très bon d'avoir une méthode qui a plusieurs rôles.
	Nous n'utiliserons pas cette méthode dans le TD, à priori. Néamoins, vous pouvez essayer de la coder, par curiosité!

	Si le temps le permet, vous pouvez aller consulter la documentation sur les [arguments nommés](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments) et
	les [valeurs par défaut des arguments](https://www.php.net/manual/en/functions.arguments.php#functions.arguments.default).

2. Dans **feed.php**, décommentez le code gérant la recepetion des données du formulaire.

3. Il ne faut plus directement instancier la nouvelle pulbication mais plutôt utiliser la méthode **create** pour créer l'objet correspondant. Adaptez donc votre code.

4. Utilisez les différents **getters** de votre objet de type `Publication` afin de réaliser une **requête d'insertion** de votre publication dans la base.

	* Rappel : INSERT INTO Nom_Table (nomCol1, nomCol2, ...) VALUES (value1, value2, ...)
	
	* On doit spécifier toutes les colonnes sauf l'identifiant qui est en auto-increment, donc géré automatiquement par MySQL.

   * Pour la date, elle doit être formatée avec les options `Y-m-d H:i:s` (il ne faut pas utiliser `getDateFormatee` qui affichage la date sous le format "Jour Mois Année"). vous pouvez soit directement formater la date avant de la mettre dans la requête ou alors créeez une méthode `getDateFormateeSQL` dans la classe `Publication`.
	
5. Tentez de créer un nouveau **feedy** (évitez les caractères comme ' pour l'instant) et vérifiez que celui-ci s'affiche bien sur la page! Bien sûr, le code d'insertion doit être placé avant celui qui récupère
toutes les publications à afficher.

</div>

## Conclusion

Nous avons un début de site fonctionnel nous permettant d'ajouter et de lister différentes publications!
Dans le prochain TD, nous verrons comment mieux organiser tout cela en créant notre **propre framework**. 
Nous améliorerons aussi la **sécurité** de **The Feed**.

En parlant de sécurité...à ce stade, votre application est vulnérable à différentes attaques, notamment au niveau de l'itnéraction avec la base de données.
Vous pouvez aussi essayer d'ajouter des feedy contenant une quote **'**, vous devriez obtenir un beau message d'erreur...

En attendant le prochain TD, nous vous invitons donc à commenter la partie d'une code gérant l'insertion de la publication dans la base (pour éviter que 
certains de vos collègues aillent exploiter ces failles sur votre application entre deux séances :D )

## Travailler depuis chez vous en local

Si vous voulez éviter de vous connecter sur webinfo (en FTP ou SSH) pour travailler depuis chez vous, vous pouvez installer un serveur Apache + PhP + MySql + PhpMyAdmin sur votre machine. Vous pourrez alors lancer votre script avec l'URL `localhost`.

#### Installation tout en un

* sous Linux : XAMP  
   [https://openclassrooms.com/fr/courses/918836-concevez-votre-site-web-avec-php-et-mysql/4237816-preparez-votre-environnement-de-travail#/id/r-7414761](https://openclassrooms.com/fr/courses/918836-concevez-votre-site-web-avec-php-et-mysql/4237816-preparez-votre-environnement-de-travail#/id/r-7414761)
  
* sous Mac OS X & Windows (MAMP) :  
  [https://openclassrooms.com/fr/courses/918836-concevez-votre-site-web-avec-php-et-mysql/4237816-preparez-votre-environnement-de-travail#/id/r-7426467](https://openclassrooms.com/fr/courses/918836-concevez-votre-site-web-avec-php-et-mysql/4237816-preparez-votre-environnement-de-travail#/id/r-7426467)  

**Attention**, pensez à modifier le `php.ini` pour mettre `display_errors = On`
et `error_reporting = E_ALL`, pour avoir les messages d'erreurs. Car par défaut,
le serveur est configuré en mode production (`display_errors = Off`). 

Pour localiser le fichier `php.ini`, exécutez la commande suivante dans un script PHP via votre navigateur:
```php
echo php_ini_loaded_file();
```
Votre `php.ini` se trouve dans `/opt/lampp/etc/` pour une installation avec XAMP sous Linux.

Il faut redémarrer Apache pour que les modifications soient prises en compte. Dans le terminal, exécutez
```bash
sudo /opt/lampp/lampp stop
sudo /opt/lampp/lampp start
```

#### Installation depuis les paquets

Pour une [installation depuis les paquets](https://www.google.com/search?q=install+apache+php+phpmyadmin+mysql+ubuntu&tbs=qdr:y) de Apache + MySql + Php + PhpMyAdmin sous Linux, votre `php.ini` se trouve dans `/etc/php/8.1/apache2/` et le redémarrage du serveur se fait avec 
```bash
sudo service apache2 restart
```


<!-- Si ça ne marche pas, c'est que l'on édite pas le bon php.ini . Afficher la
configuration vec phpinfo() pour trouver le php.ini qui est utilisé -->


<!--
Nombre d'arguments variable
http://php.net/manual/fr/functions.arguments.php#functions.variable-arg-list

... en PHP 5.6+

utilisé dans la fonction comme un tableau
function sum(...$numbers) { ...}

à l'inverse, tableau vers liste d'arguments 
add(...[1, 2])

-->
