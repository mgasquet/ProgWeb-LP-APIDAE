---
title: TD4 &ndash; Evolution de l'application
subtitle: Framework, Paramètres, Evenements, Services, Utilisateurs, Session, Flash
layout: tutorial
lang: fr
---

## Démarrage

Pour sauvegarder votre progression TD par TD, il est conseillé de recréer un nouveau dossier pour chaque TD et d'y copier le contenu réalisé lors du précédent TD.

A l'aide de PHPStorm créez dond un nouveau projet vide dans le dossier `public_html/TD4` 
de votre répertoire personnel. 
Pour ceci, sélectionnez `New Project`, `PHP Empty Project`, Location: `/home/licence/votre_login/public_html/TD4`.

Copiez le contenu de votre dossier `TD3` dans `TD4`.

Vérifiez que l'URL suivante donne bien accès à votre site : 

[http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD4/web/](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD4/web/).

Attention, dorénavant, il faudra bien vérifier que `TD4` est dans l'URL!

## Paramètres globaux de l'application

Avant de nous lancer pleinement dans le développement de notre application, nous allons améliorer notre système de configuration.  
Comme nous l'avons vu dans le précédent TP, il est possible de définir des **paramètres** dans le conteneur de services (c'est ce que nous avons fait avec le paramètre `debug`). Jusqu'ici, nous avons défini des paramètres essentiellement liés au fonctionnement du framework. Il serait bien de définir un système pour définir un ensemble de paramètres relatifs à notre application et déclarés dans notre fichier de configuration.  
Cela nous sera notamment utile lorsque nous aurons besoin de ces paramètres dans les `services` déclarés par l'application (et pas le framework).

<div class="exercise">

1. Dans `ConfigurationGlobal`, définissez une constante `parameters` qui est un tableau associatif (associant des noms de paramètres à des valeurs...)

2. Dans `AppInitializer`, faites en sorte que tous les paramètres définis pour la constante `parameters` soient enregistrés comme paramètres du conteneur de services.

</div>

## Utilisateurs

nous allons maintenant ajouter des **utilisateurs** à notre application! Fini les feedies anonyme...Cela implique beaucoup de choses :

   * Inscription et connexion
   * Gestion sécurisé des mots de passe
   * Sauvegarde de l'état de l'utilisateur (la "session")
   * Gestion de fichiers (photo de profil...)
   * Accès aux routes (certaines routes accessibles seulement aux utilisateurs connectés...)

Nous allons donc voir, point par point comment ajouter une telle entité à notre application. A noter que certains systèmes que nous allons mettre en place peuvent être réutilisés dans d'autres applications qui nécéssitent un système d'authentification / de gestion des utilisateurs.

### Création de la table et de l'entité

Tout d'abord, il faut que vous définissiez une nouvelle `table` dans votre base de données (MySQL pour le moment, c'est-à-dire celle utilisée en `production`) :

<div class="exercise"> 

1. Dans votre [base de données phpMyAdmin](http://webinfo.iutmontp.univ-montp2.fr/my), créez une table `utilisateurs` (sans majuscules) contenant 5 champs :

   * `idUtilisateur` de type `INT` défini comme la clé primaire (Index : `Primary`) 
      et en mode auto-increment (case `A_I`).

   * `login` de type `VARCHAR` d'une longueur maximale de 20 et défini comme `UNIQUE` (pas deux utilisateurs avec le même login).

   * `password` de type `TEXT`.

   * `adresseMail` de type `TEXT` et défini comme `UNIQUE` (pas deux utilisateurs avec la même adresse mail).

   * `profilePictureName` de type `VARCHAR` d'une longueur maximale de 64.

2. Créez une classe `Utilisateur`. Si vous avez bien suivi les TPs précédents, vous devriez savoir où la placer dans votre application! Donnez lui le `namespace` adéquat.

3. Définissez les différents attributs de cette classe en bous basant sur les champs de la table `utilisateurs`. Créeez également les getters et setters (ils peuvent êtres générés facilement avec `PHPStorm`).

4. De la même manière que nous l'avons fait pour `Publication`, définissez un constructeur vide et une méthode **static** `create` qui prend en paramètres tout sauf l'identifiant de l'utilisateur. Cette méthode initialise un utilisateur avec les données passées en paramètres puis le renvoi. L'identifiant n'est pas géré ici, c'est la base de données qui s'en chargera (le `autoincrement`).

5. Testez rapidement la création d'un utilisateur avec la méthode `create` dans `app.php` et supprimez ce test ensuite. Vous pouvez débugger efficacement une variable (afficher son contenu en détail) avec la fonction `var_dump($variable)`.

</div>

Quelques notes sur ce que nous venons de créer :

   * Nous nous servons d'un **identifiant numérique** plutôt que le `login` comme **clé primaire**. Il y a plusieurs raisons à cela. Tout d'abord, utiliser des clés primaires numérique est une meilleur pratique. Deuxièmement, le `login` est une donnée qui peut changer (si on autorise l'utilisateur à changer de login). Dans ce contexte, il est préférable d'avoir une clé qui ne changera jamais. Autrement, tous les attributs faisant référence à un utilisateur devraient être mis à jour lors du changement de login...!

   * Le champ `password` représente le mot de passe `chiffré`. Vous ne devez jamais stocker des mots de passe "en clair" dans votre base de données (sinon c'est la catastrophe en cas de fuite!).

   * Le champ `profilePictureName` représente le nom du fichier contenant la photo de profil. Ce nom sera généré à partir du login (actuel) de l'utilisateur lors de l'upload et transformé avec une fonction `uniqid` permettant de créer un identifiant unique (nous n'utiliserons pas le nom d'origine). Avec cette méthode, si nous changeons le nom de l'utilisateur, nous n'aurons pas à changer le nom de ce fichier.

Pour l'instant, vous devrez exclusivement travailler sur votre environnement de **production** (`app.php`) car la base de données `sqlite` utilisée dans l'environnement de **développement** n'est pas encore à jour. Mais pas de panique, nous réglerons ce point un peu plus tard.

### Création du repository

Nous allons maitnenant créer le `repository` permettant de récupérer et de `mapper` (convertir en objet) les `utilisateurs` depuis la source de données.

<div class="exercise">

1. Créez une classe `UtilisateurRepositorySQL`. Vous devriez aussi savoir où la placer! Donnez lui le bon `namespace` et faites là implémenter l'interface `Repository`. 

2. Complétez les méthodes `get`, `create` et `remove`. Vous pourrez éventuellement compléter les autres méthodes plus tard (vous pouvez les laisser vide, nous n'en aurons pas besoin dans le cadre du TP, mais si vous avez un peu de temps, elles ne sont pas très dures à implémenter). Vous pouvez vous inspirer de `PublicationRepository`.

3. Dans votre fichier `ConfigurationGlobal`, enregistrez ce repository en associant l'entité `Utilisateur` à ce dernier.

4. Dans `app.php`, faites de petits tests pour voir si vous arrivez, en utilisant le `repository` (en le récupérant via le service `repository_manager`depuis le container) à sauvegarder un utilisateur (précisez  des données de test pour les attributs de l'utilisateur), à la récupérer et à le supprimer. Si tout marche bien, supprimez vos tests. Votre repository est fonctionnel!

</div>

### Création du service

Maintenant que nous avons tout ce qu'il faut pour traiter et gérer la persitance des `utilisateurs`, il faut créer le `service` correspondant! Comme pour celui relatif aux `publications`, il devra permettre au `controller` de récupérer les utilisateurs et déclencher divers traitements (création, supression...) en utiliseant le `repository` adéquat, injecté dans le service.

<div class="exercise">

1. Créez une classe `UtilisateurService`. Placez-là au bon endroit et donnez lui le bon `namespace`.

2. Définiez un attribut `repository` et créez le constructeur adéquat permettant d'intialiser ce service.

3. Dans votre classe `ConfigurationGlobal`, enregistrez ce nouveau service sous le nom `utilisateur_service` et injectez-lui la dépendance qu'il attend.

4. Dans votre classe `UtilisateurService`, créez une méthode `getUtilisateur` permettant de récupérer un utilisateur gtâce à son identifiant.

5. Ajoutez une deuxième méthode `getUtilisateurByLogin` permettant de récupérer un utilisateur gtâce à son login. Il faudra par conséquence ajouter **une nouvelle méthode** dans le repository gérant les `utilisateurs`.

6. Dans votre base de données, sur `phpMyAdmin`, ajoutez des utilisateurs à la main. Ensuite, dans `app_php`, en récupérant ce service depuis le container, testez ces deux méthodes. Vous pouvez encore une fois utiliser `var_dump` pour consulter le détail de la variable. Une fois que tout fonctionne, effacez vos tests.

</div>

### Inscription

Nous allons maintenant gérer l'inscription d'un utilisateur! Cela va donc impliquer la création et l'enregistrement du **controller** adéquat, le **chiffrement** des mots de passes, la gestion des **fichiers** uploadés...

<div class="exercise">

1. Créez une classe `UtilisateurController` au bon endroit, n'oubliez pas le `namespace`. Fates-là également hériter de la classe adéquate.

2. Enregistrez ce nouveau `controller` dans votre fichier de configuration.

3. Dans votre dossier `View`, créez un novueau repertoire `Utilisateurs`. A l'intérieur, créez un nouveau template twig `inscription.html.twig`. Ce template doit étendre `base.html.twig`, redéfinir le **titre de la page** en **"Inscription**". Enfin, le bloc de contenu principal (`page_content`) doit être redéfini pour contenir le code `HTML` suivant :

   ```html
   <main>
      <form action="" id="form-access" class="center" method="post" enctype="multipart/form-data">
         <fieldset>
            <legend>Inscription</legend>
               <div class="access-container">
                  <label for="login">Login</label>
                  <p class="help-input-form">Entre 4 et 20 caractères</p>
                  <input id="login" type="text" name="login" minlength="4" maxlength="20" required/>
               </div>
               <div class="access-container">
                  <label for="password">Mot de passe</label>
                  <p class="help-input-form">Entre 8 et 20 caractères, au moins une minuscule, une majuscule et un nombre</p>
                  <input id="password" type="password" name="password" pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$" required/>
               </div>
               <div class="access-container">
                  <label for="mail">Adresse mail</label>
                  <input id="mail" type="email"name="adresseMail" required/>
               </div>
               <div class="access-container">
                  <label for="profile-pic">Photo de profil</label>
                  <input required type="file" id="profile-pic" name="profilePicture" accept="image/png, image/jpeg">
                </div>
               <input id="access-submit" type="submit" value="S'inscrire">
         </fieldset>
      </form>
   </main>
   ```

4. Mettez à jour votre fichier `styles.css` en le remplaçant par [celui-ci]({{site.baseurl}}/assets/TD4/styles.css).

5. Dans votre `controller`, créez une action `getInscription` qui renvoie l'utilisateur sur la page générée par le template précédent. 

6. Enregistrez une `route` ayant pour chemin `/inscription` qui déclenche l'action que vous venez de créer lors de la question précédente. Cette `route` ne doit être accessible que par la méthode `GET`. Nommez-là comme bon vous semble.

7. Testez votre nouvelle `route` : [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD4/web/inscription](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD4/web/inscription). Si la page s'affiche bizarrement, videz votre cache avec `CTRL+F5` (à faire régulièrement quand on travaille avec du `CSS`).

</div>

Quelques commentaires sur cette page d'inscription :

   * L'attribut `enctype="multipart/form-data"` est utilisé lorsqu'on envoi des données volumineuses, comme des fichiers.

   * On a limité le login entre 4 et 20 caractères (avec `minlength` et `maxlength`)

   * Le `pattern` **^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$** est une expression régulière qui permet d'obliger le mot de passe à être défini entre 8 et 20 caracères, avoir au moins une minuscule, une majuscule et un nombre.

   * L'attribut `accept` permet de définir quels fichiers sont acceptés (ici, `jpeg` et `png`). Les autres fichiers ne sent pas montrés dans l'explorateur, lors de la recherche.

Maintenant, il faut créer l'action d'inscription du côté `back-end`!

<div class="exercise">

1. Créez une méthode `createUtilisateur` dans `UtilisateurService`. Cette méthode doit prendre en paramètre : un `login`, un `mot de passe` (pas encore chiffré), une `adresse mail` (chaine de caractères) et un `fichier` (contenant les informations de la photo de profil...).

2. Tout d'abord, nous allons devoir `chiffrer` le mot de passe. Nous allons utiliser une technique courante permettant d'identifier les utilisateurs de manière sécurisée :

   * On chiffre le mot de passe avec un algorithme de chiffrement à sens unique (par exemple `BCRYPT`). Le mot de passe chiffré ne peut pas être déchiffré. Il est stcoké ainsi dans la base de données.

   * Lorsuq'un utilisateur souhaite se connecter, il fournit son mot de passe non chiffré (en "clair"). On réapplique le même chiffrement à ce mot de passe et on compare avec celui stocké en base de données. Si les deux valeurs chiffrées correspondent, alors l'utilisateur a entré le bon mot de passe.

   * Pour plus de sécurité, on utilise un mécanisme appellé `salt`. Ce mécanisme consite à stocker, côté serveur, une chaîne de caractères (complexe) appellée `salt` que l'on va coller au mot de passe en clair, avant de le chiffrer. Ainsi, la sécurité de la chaîne codée est renforcée et permet de se protéger contre les **attaques par dictionnaire** en cas de fuite de la base. Ce genre de dictionnaire répertorie un ensemble de chaîne chiffrées de mot de passes "simples" en les faisant correspondre à la chaîne originale. Mais avec la technique du `salt`, un mot de passe simple devient complexe. Par exemple :

   ```php
   $salt = "sd!!f84dçih32mgùb;sfs"
   $motDePasse = "pomme"; //Mot de passe vulnérable aux attaques par dictionnaire, même chiffré!
   $motDePasseSalted = $salt.$motDePasse; //sd!!f84dçih32mgùb;sfspomme : mot de passe complexe!
   ```

   Il faut donc utiliser le `salt` quand on chiffre le mot de passe lors de l'inscription et aussi quand l'utilisateur se connecte.

   Pour **chiffrer** un mot de passe, on utilise la fonction suivante :

   ```php
   $chiffre = password_hash($mdp, PASSWORD_BCRYPT); // D'autres algos de chiffrement sont utilisables.
   ```

   Mais dans notre cas, il ne faut pas oublier que le mot de passe aura été salé, donc :

   ```php
   $motDePasseSalted = $salt.$mdp;
   $chiffre = password_hash($motDePasseSalted, PASSWORD_BCRYPT);
   ```

   On vous demande donc de :

      1. Créez un `paramètre` **salt** dans le tableau de paramètres de l'application, dans le fichier de configuration (celui que vous avez créé au début du TP). Donnez-lui une valeur assez complexe (longue chaine, caractères spéciaux, majuscule, minuscules, nombres...).

      2. Injectez ce paramètre dans le service des utilisateurs (il faudra donc aussi modifier la classe `UtilisateurService` et son constructeur en conséquence...). Pour rappel, pour faire référence à un paramètre lors de l'injection de dépendances, on utilise simplement : `%nom_parametre%`.

      3. Dans la méthode `createUtilisateur`, chiffrez le mot de passe donné en paramètre en appliquant le `salt` au préalable (qui doit maintenant être injecté dans la classe...). C'est ce mot de passe "chiffré" qui sera placé dans l'objet `Utilisateur` qui va être créé.

3. Concernant **le fichier** contenant l'image, celui-ci est un objet `UploadedFile` qui contient diverses méthodes utiles, notamment :

   * `guessExtension()` qui permet de récupérer l'extension du fichier.

   * `move($destination, $newName)` qui permet de sauvegarder le fichier dans un dossier en lui donnant un nouveau nom.

   Pour pouvoir utiliser la méthode `guessExtension()`, il faut installer un petit composant :

   ```bash
   composer require symfony/mime
   ```

   Le nouveau nom du fichier sera un identifiant unique. Pour faire cela, `PHP` nous met à disposition une fonction toute prête :

   ```php
   $identifiant = uniqid()
   ```

   L'unicité de cette valeur se base sur l'horloge système, il ne faut donc pas l'utiliser dans un contexte où on osuhaite générer quelquechose de sécurisé et unique au monde. Dans notre contexte, cela ira très bien.

   Nous viendrons alors concatener ce nouveau nom avec l'extension obtenue grâce à `guessExtension`. Il ne faut pas oublier d'ajouter le `.` entre les deux chaînes!

   Concernant l'emplacement du fichier, celui-ci devra être envoyé dans `web/assets/img/utilisateurs`. C'est donc encore un paramètre qui doit être **injecté** à notre service! 
   
   En résumé, il vous faut donc :

      1. Créer un paramètre dans le tableau de paramètres de l'application qui va référencer le ddossier contenant les photos de profil, donc, par rapport à `ConfigurationGlobal` : 
      
      ```php
      __DIR__ . '/../web/assets/img/utilisateurs
      ```

      2. Injecter ce paramètre dans le service des utilisateurs

      3. Obtenir le nom final de l'image en : créant le nom de base en utilisant `uniqid`, puis en obtenant le type de l'image, et enfin, en concatenant les deux.

      4. Déplacer le fichier vers le dossier des images de profils en utilisant le chemin injecté dans le service et le nom de fichier récupéré à l'étape précédente. Le nom de fichier créé à l'étape précédente sera celui stocké dans l'objet `Utilisateur` (et donc en base de données).

4. Pour le login et l'adresse mail, il n'y a pas de traitement particulier (pour le moement!). Il ne vous reste plus qu'à **créer** l'utilisateur et à le sauvegarder dans la soruce de données grâce au `repostory`.      

5. Dans `UtilisateurController`, créez une méthode `submitInscription` prenant en paramètre un objet `Request $request`. Extrayez les différents paramètres du formulaire (il faut regarder l'attribut `name` dans le code `HTML`) en vous servant de cet objet (aller voir dans `submitFeedy` si vous ne vous souvenez plus). Attention, la récupération du fichier se fait différemment. Il faut utiliser `$request->files->get('nomAttribut')`.

6. La méthode `submitInscription` doit ensuite simplement utiliser le **service des utilisateurs** (`utilisateur_service`) pour créer l'utilisateur à partir de ces paramètres. Elle redirige ensuite vers la page d'accueil (route `feed`).

7. Enfin, créez la route `/inscription` uniquement accessible avec la méthode `POST` et qui déclenche l'action précédente. Nommez-là comme bon vous semble.

8. Dans le template `inscription.html.twig`, spécifiez l'attribut `action` sur le formulaire, afin d'indiquer la bonne route pour l'envoi des données. Pour rappel, une `fonction` définie dans notre extension `twig` permet de faire cela assez facilement, en utilisant le nom de la route.

9. Rechargez votre page d'inscription et inscrivez un utilisateur. Si tout se passe bien (si vous êtes redirigé sur la page d'accueil), allez visualiser les données de cet utilisateur dans la base de données. Vérifiez également que la photo de profil a bien été placée dans le dossier désiré!

</div>

## Gestion des événements

Lors du cyle de vie d'une application (web ou autre), certaines entités ont besoin de savoir quand certains événements de produisent, afin de réaliser des actions diverses. Par exemple, analyser le résultat d'un traitement, annuler ou modifier la suite de l'éxécution du code, attacher des données personnalisées à une entité, récupérer des données...

Ce type de programmation basée sur les événements est par exemple utilisé dans le monde du `modding` de jeux vidéos (par exemple, pour `Minecraft`). Le jeu émet périodiquement des événements avant et après avoir réaliser des actions. Certaines classes des `mods` peuvent alors capter ces évenements et éxécuter du code. Par exemple, on pourrait imaginer que le jeu envoi un événements chaque fois que le joueur subit un dommage. Un mod `écoutant` cet événement serait alors capable de le capter et de l'annuler, ou bien modifier les dommages subits, ou alors afficher un message dans la console, etc...

Dans le cadre de notre framework, ce mécanisme peut aussi s'avérer utile! Et justement, `symfony` nous met à disposition les otuils nécessaires pour réaliser ce genre de fonctionnalité.

Dans notre cas, il pourrait être intéressant que le `framework` émette des événements avant le traitement d'une requête et avant l'envoi d'une réponse, par exemple. Ces événements pourraient alors être capté par notre application (et/ou par le framework lui-même) et traités, à diverses fins.

Pour mettre en place cela, on utilise :

   * Un `EventDispatcher` : Il s'agit de l'objet qui permet de déclencher un événement et de notifier les entités intéressées.

   * Des objets de type `Event` qui contiennent diverses informations qui pourront être utilisées par ceux qui traitent l'événement. Cet objet sert à la fois de canal d'entrée et de sortie car une fois que le framework a émit un événement, il peut donc le lire et récupérer des données éventuellement définies par les entités qui ont traité l'événement.

   * Des objets de tpye `EventSubscriber` qui sont les entités qui désirent être notifiées quand un événement se produit. Elles contiennent différentes méthodes à déclencher selon l'événement qui se produit. 

Tout d'abord, nous allons commencer par injecter un `EventDispatcher` dans notre classe `Appframework`.

<div class="exercise">

1. Dans `AppFramework`, ajoutez un attribut `$eventDispatcher` de type `EventDispatcherInterface` (sélectionnez bien la version situé sur ce namespace : `Symfony\Contracts\EventDispatcher\EventDispatcherInterface`). Adaptez le constructeur en conséquence.

2. Dans `AppInitializer`, enregistrez le service `event_dispatcher` en utilisant la classe concrète `EventDispatcher` (vérifiez bien le namespace là aussi). Il n'y a pas (encore) de dépendances à injecter à ce service.

3. Injectez ce nouveau service dans votre service `framework`.

4. Vérifiez que tout fonctionne comme avant, sans message d'erreurs.

</div>

### Evenement lors de la réception d'une requête

Bien, nous avons de quoi envoyer des événements, mais aucun événement à envoyer! Nous allons donc créer notre premier événement qui sera émis avant le traitement d'une requête.

<div class="exercise">

1. Dans le dossier `external/Framework` créez un dossier `Events`.

2. Dans ce nouveau dossier, créez une classe `RequestHandlingEvent`. Définissez son `namespace`. Cette classe devra hériter de la classe `Event` et conteindra un attribut `request`. définissez le constructeur adéquat ainsi q'un `getter` pour cet attribut.

3. Pour envoyer (dispatcher) un évenement, on utilise la méthode suivante : 

   ```php
   $event = ...
   $eventDispatcher->dispatch($event, 'nom');
   ```

   Le `nom` correspond à un nom associé à cet événement. Cela permet de réeutiliser un même type (même classe) d'événement mais sous différents noms.

   Dans `AppFramework`, au tout début de la méthode `handle` créez un nouvel événement de type `RequestHandlingEvent` en passant la requête traitée en paramètre puis, servez-vous de votre `eventDispatcher` pour diffuser cet événement sous le nom `onRequestHandling`.

4. Comme toujours, vérifiez que rien n'est cassé.

</div>

### Listener du framework

Bien, il ne nous manque plus de quoi écouter et traiter l'événement! Nous allons créer un `listener` capable de traiter l'événement `RequestHandlingEvent` au niveau du framework (pour commencer). Il ne nous sera utile très prochainement.

Pour qu'une classe puisse gérer des événements, il faut qu'elle implémente l'interface `EventSubscriberInterface`. Elle doit alors implémenter la méthode **static** `getSubscribedEvents` qui doit renvoyer un tableau associatif sous la forme :

```php
['nomEvenement' => 'methodeAExecuter', '...' => '...']
```

   * `nomEvenement` correspond au nom de l'événement émis par `eventDispatcher`

   * `methodeAExecuter` correspond à la méthode à éxécuter quand cet événement survient. Elle doit accueillir en paramètre un objet correspondant à l'événement traité.

Donc, par exemple, si je souhaite traiter un événement de type `MonEvent` émis par le dispatcher sous le nom `onCustomEvent`, je peux mettre en place la classe suivante :

```php

class ExempleListener implements EventSubscriberInterface {

   public function excempleTraitement(MonEvent $event) {
      ...
   }

   public static getSubscribedEvents() {
      ['onCustomEvent' => 'excempleTraitement']
   }

}
```

Bien sûr, il est possible de traiter plusieurs événements avec une même classe.

Il faut ensuite enregistrer ce `listener` aurpès du dispatcher. On utilise pour cela la méthode `addSubscriber`.

<div class="exercise">

1. Créez un dossier `Listener` dans `external/Framework`. Dans ce dossier, créez une classe `FrameworkListener`. Donnez-lui le `namespace` adéquat et faites la implémenter l'interface `EventSubscriberInterface`.

2. Créez une méthode `setupAppFromRequest` qui prend en paramètre un événement de type `RequestHandlingEvent`. Cette méthode fera simplement un `echo "Coucou";` pour le moment.

3. Implémentez la méthode **static** `getSubscribedEvents` afin que votre classe puisse traiter avec la méthode `setupAppFromRequest`l'événement émis par votre dispatcher dans `AppFramework`.

4. Dans `AppInitializer`, enregistrez un service nommé `framework_listener` en utlisant la classe `FrameworkListener`.

5. En utilisant la méthode `addMethodCall` faites en sorte que la méthode `addSubscriber` soit appellée lors de l'initialisation du service `event_dispatcher` pour enregistrer notre listener. Il faudra donc lui passer en paramètre une `référence` vers le service `framework_listener` défini à la question précédete.

6. Chargez n'importe quelle page de votre application, un "coucou" devrait apparaitre en haut. Une fois le test effectué, supprimez la ligne de code affichant de message.

7. Dans votre fichier `ConfigurationGlobal`, définissez une constante `listeners` dont le rôle sera de lister (dans un tableau simple) divers noms de services à enregsitrer aurpès du dispatcher. Dans `AppInitializer`, faites en sorte d'ajouter tous ces services comme `subscriber` du service `event_dispatcher`. Cela nous servira plus tard lorsque notre application enregstrera ses propres `listeners`, pour traiter des événements.

</div>

## Les sessions

En PHP, un objet spécial appellé `session` permet de sauvegarder des données concernant l'utilisateur en mémoire, pour une certaine durée. Cela est très utile quand il faut se rappeller que l'utilisateur est connecté, par exemple, pour qu'il puisse effectuer certaines actions protégées (comme publier un **feedy**).

Encore une fois, les briques de `symfony` que nous avons installé nous facilitent beaucoup le travail. Pour démarrer ou récupérer une session, il suffit d'éxécuter le code suivant :

```php
$session = new Session();
$session->start();
```

Cela peut être perturbant, mais le `new` ne va pas forcément créer une nouvelle session. En fait, si une session existe déjà pour l'utilisateur concerné par la requête courante, le `new` va récupérer cet objet, stocké dans la mémoire du programme. Si la session n'existe pas, celle-ci est créée, démarrée et affectée à l'utilisateur courant. Chaque utilisateur possède une session. PHP permet d'identifier quelle session récupérer grâce à un `cookie` nommé `PHPSESSID` envoyé à chaque requête par le navigateur. Il s'agit d'une donnée permttant d'identifier l'utilisateur. Il ne faut donc pas que celle-ci soit dérobée car on pourrait alors usurper l'identité d'un client auprès du serveur.

Ensuite, la `session` propose différentes méthodes pour manipuler des données (un peu comme un tableau associatif) qui seront donc toujours accessible (jusqu'à la fin de la session) entre les requêtes du même utilisateurs :

```php
$val = $session->get($key); //Récupère un élément correspondant à la clé
$session->set($key, $value); //Associe une clé à un élément
$session->has($key); //Vérifie si la session contient la clé...
$session->remove($key); //Supprime la donnée et l'association correspondants à la clé passée en paramètre
```

### Un manager de sessions

Nous nous proposons de créer un `manager de session` dont le rôle sera de gérer la session courante de l'utilisateur et de fournir les méthodes pour interagir avec.

<div class="exercise">

1. Créez un dossier `Service` dans `external/Framework` puis, à l'intérieur, créez une classe `ServerSessionManager`. Donnez-lui le bon `namespace`.

2. Ajoutez un attirbut `$session` de type `Session` qui ne sera pas initialisé par un paramètre passé dans le constructeur.

3. Définissez une méthode `updateSession` qui exécute le code de création (ou récupération) de session tel que présenté plus tôt et stocke le résultat dans votre attribut `$this->session`.

4. Créez différentes méthodes `get($value)`, `set($key, $value)`, `has($key)` et `remove($key)` dont le rôle est d'éxécuter la même méthode sur l'attribut `$this->session` (et de renvoyer le résultat pour `get` et `has`). Le but est de `protéger` l'objet de session qui ne sera pas directement accessible. La classe agit alors comme une `façade` (cela nous sera aussi utile quand on installera un autre type de manager de "session").

5. A partir des méthodes définies dans cette classe, créez une interface nommée `UserSessionManager`. Cela peut être fait facilement grâce à `PHPStorm`. Faites implémenter cette interface par `ServerSessionManager`.

6. Enregistrez cette nouvelle classe comme un service nommé `session_manager`.

7. Modifiez la classe `FrameworkListener` pour lui ajouter un attribut `$sessionManager` de type `UserSessionManager` et `$twig` de type `Environment` initialisés via le constructeur.

8. Il est important que nos templates `twig` puissent accèder à notre manager de session, par exemple, pour afficher certains menu ou non si l'utilisateur est connecté. Pour cela, `twig` propose dinjecter des varaibles globales dans les templates avec :

   ```php
   $twig->addGlobal($key, $value);
   ```

   Modifiez la méthode `setupAppFromRequest` afin d'appeller la méthode `updateSession` sur le `session manager` puis pour que ce dernier soit injecté comme paramètre global de twig sous le nom de `session`.

9. Faites les modficiations nécessaires dans `AppInitializer` pour injecter les deux dépendances de `framework_listener`.

10. Vérifiez que rien n'est cassé.

</div>

## Connexion

Bien, nous avons maintenant de quoi **connecter**, **déconnecter** et **identifier** notre utilisateur! Et nos templates peuvent aussi connaître l'état de l'utilisateur via le session manager.

Pour gérer l'état "connecté" de l'utilisateur, nous allons utiliser une mécanisme très simple :

   * Lorsqu'un utilisateur se connecte, on associe son identifiant à une clé `id` dans la session.

   * Si la session possède une clé `id`, alors l'utilisateur est connecté.
   
   * Quand il effectue une action, on peut alors utiliser on `id` comme paramètre (par exemple, quand il créé une publication...)

   * Lors de la déconnexion on supprime l'asociation correspondant à `id` dans la session.

### Nouvelles méthodes pour le service des utilisateurs

Tout d'abord, de quoi se connecter. Souvvenez-vous, dans la base, le mot de passe est `chiffré`, donc il va falloir utiliser une fonction pour comparer le mot de passe en clair à sa version chiffré :

```php
$result = password_verify($mdpNonChiffre, $mdpChiffre);
```

Cette fonction va chiffrer le mot de passe "en clair" passé en paramètre et le comparer au mot de passe chiffré. S'il y a correspondance, alors la valeur `true` est retournée. Il n'y a pas besoin de préciser l'algorithme utilisé car toutes ces informations sont déjà incluses dans le mot de apsse chiffré. Attention néamoins, dans notre cas, nous avons utilisé un `salt`! Il faut donc l'appliquer au mot de passe non chiffré avant la vérification.

```php
$mdpComplet = $salt.$mdpNonChiffre
$result = password_verify($mdpComplet, $mdpChiffre);
```

<div class="exercise">

1. Faites en sorte que `UtilisateurService` ait accès au service `session_manager` en l'injectant via le contenur de service.

2. Toujours dans `UtilisateurService`, créez une méthode `connexion` qui prend en paramètre un login et un mot de passe (non chiffré). Cette méthode doit récupérer l'utilistaeur correspondant au login, puis, vérifier son mot de passe. 

3. Si tout est valide, l'identifiant de l'utilisateur est placé dans la session via le `manager` en l'associant à la clé `id`.

</div>

Maintenant, diverses méthodes utiles :

<div class="exercise">

1. Toujours dans `UtilisateurService`, créez une méthode `getUserId` qui renvoie l'id de l'utilisateur stocké dans la session.

2. Créez une autre méthode `estConnecte` qui renvoie `true` si la clé `id` est bien définie dans la session et `false` sinon.

3. Enfin, créez une méthode `deconnexion` qui supprime la valeur correspondante à la clé `id` dans la session.

</div>

### Prise en charge des actions

Nous allons maintenant créer les actions et les routes qui permettent de se connecter et de se déconnecter.

<div class="exercise">

1. Dans `src/View/Utilisateurs`, créez un template `connexion.html.twig` avec le contenu suivant :

   ```twig
   {% raw %}
   {% extends "base.html.twig" %}

   {% block page_title %}Connexion{% endblock %}

   {% block page_content %}
    <main>
        <form action="" id="form-access" class="center" method="post">
            <fieldset>
                <legend>Connexion</legend>
                <div class="access-container">
                    <label for="login">Login</label>
                    <input id="login" type="text" name="login" required/>
                </div>
                <div class="access-container">
                    <label for="password">Mot de passe</label>
                    <input id="password" type="password" name="password" required/>
                </div>
                <input id="access-submit" type="submit" value="Se connecter">
            </fieldset>
        </form>
    </main>
   {% endblock %}
   {% endraw %}
   ```

2. Dans `UtilisateurController`, créez une méthode `getConnexion` qui permet simplement de renvoyer la page générée par le tamplte créé lors de la question précédente.

3. Créez la route `/connexion` qui déclenche cette action et qui est uniquement accessible avec `GET`. Nommez-là comme bon vous semble.

4. Testez votre route et vérifiez que la page de connexion s'affiche bien.

5. Créez une autre méthode `submitConnexion` qui prend en paramètre un objet `Request $request` et récupère le login et le mot de passe stockés dans le corps de la requête afin de déclencher la méthode `connexion` via le service des utilisateurs. Cette méthode redirige ensuite vers la page d'accueil (route `feed`).

6. Créez la route `/connexion` qui déclenche cette action et qui est uniquement accessible avec `POST`. Nommez-là comme bon vous semble.

7. Dans le template `connexion.html.twig`, mettez à jour l'attribut `action` du formulaire pour spécifier la bonne route (que vous avez créé à l'étape précédente).

8. Allez sur la page de connexion et tentez de vous connecter avec le compte que vous avez créé précédemment. Vérifiez que tout marche bien et que vous êtes renvoyé à la page d'accueil.

9. Créez une méthode `submitDeconnexion` qui déconnecte l'utilisateur via le service des utilisateurs puis renvoie vers la page d'accueil. Créez la route associée `/deconnexion` uniquement accessible avec `GET`. Vérifiez que tout se passe bien quand vous appellez cette route (donc en y accèdant normalement via la barre de recherche, puisque c'est en get!)

</div>

### Prise en charge sur les templates

Nous allons prendre en compte le fait que l'utilisateur soit connecté ou non dans nos `templates`. Avec `twig`, il est possible de vérifier simplement si une variable existe (n'est pas null) ou n'est pas vide (tableau vide) en faisant :

```twig
{% raw %}
   {% if variable %}

   {% else %}

   {% endif %}


   {% if not variable %}

   {% endif %}
{% endraw %}
```

<div class="exercise">

1. Modifiez le `header` du template `base.html.twig` ainsi :

   ```twig
   {% raw %}
   <header>
      <div id="titre" class="center">
         <a href="{{route('feed')}}"><span>The Feed</span></a>
         <nav>
               <a href="{{ route("feed") }}">Accueil</a>
               {%  if session.get('id') %}
                  <a href="">Ma page</a>
                  <a href="{{ route("???") }}">Déconnexion</a>
               {% else %}
                  <a href="{{ route("???") }}">Inscription</a>
                  <a href="{{ route("???") }}">Connexion</a>
               {% endif %}
         </nav>
      </div>
   </header>
   {% endraw %}
   ```

   On a alors deux menus : un "connecté" permettant d'accèder à une page personnelle (pas encore défini) et de se déconnecter et une autre, pour les utilisateurs "non connecté" qui nous propose d'accèder à la pagede  connexion ou de nous inscrire. 

2. Remplacez les `???` avec les noms de routes adéquats.

3. Vérifiez que le menu change selon si vous êtes connecté/déconnecté.

4. Modifiez le template `feed.html.twig` pour que le formulaire de création d'un **feedy** ne soit affiché qu'aux utilisateurs connectés.

5. Modifiez le template `feed.html.twig` pour générer cette balise (en dernier élément du `main`) s'il n'y a aucune publications :

   ```html
      <p id="no-publications" class="center">Pas de publications pour le moment!</p>
   ```

6. Testez votre page avec les deux modes connecté/déconnecté.

</div>

## Evolution des publications

Nous disposons maitnenant d'utilisateurs fonctionnels qui peuvent se connecter et se déconnecter. Nous allons donc limiter l'envoi de **feedies** aux utilisateurs connectés. De plus, chaque feedy pourra ainsi afficher les informations sur son auteur (photo de profil, pseudo...).

### Lien avec les utilisateurs

Pour prendre en compte ces changements, il va falloir modifier le schéma de la base de données et donc, notre repository de publications, en conséquence.

<div class="exercise">

1. Sur `phpMyAdmin`, supprimez toutes vos publications.

2. Modifiez la structure de la table `publications` en sélectionnant `idAuteur` puis en appuyant sur `Modifier`. Il vous faudra alors renommer l'attribut `loginAuteur` en `idAuteur` et changer le type en `INT`.

3. Depuis la page de `structure` de la table `publications`, cliquez sur le bouton `Vue relationnelle`. Définissez alors une `contrainte` nommée `fk_auteur` qui relie l'attribut `idAuteur` à la clé primaire `idUtilisateur` de la table `utilisateurs`. Précisez la valeur `CASCADE` pour les paramètres `ON DELETE` et `ON UPDATE`. Cela a pour effet de transformer l'attribut `idAuteur` en **clé étrangère**. Le paramétrage `ON CASCADE` fait en sorte de supprimer toutes les publicaitons d'un utilisateur si celui-ci est supprimé (ce qui semble logique).

4. Modifiez votre classe `Publication` pour remplacer `$loginAuteur` par un attribut `$utilisateur` du type `Utilisateur`. En effet, la classe ne contiendra pas simplement la clé étrangère, mais un utilisateur (du moins, une partie de ses attributs...)! Il faudra donc aussi modifier les getters et les setters ainsi que la méthode `create` en conséquence.

5. Vous devez maintenant modifier les méthodes `getAll`, `get`, `create` et `update` de votre `PublicationRepositorySQL`. Pour les méthodes de `lecture`, il faudra maitnenant faire une `jointure` avec la table `utilisateurs`. Le `select` devra aussi préciser quels attributs il récupère. Du côté de l'utilisateur, seul l'id, le login et la photo de profil nous intéresse. La méthode devra donc instancier un utilisateur, remplir certains de ces attributs et l'affecter à la publication.

   Regardons ce que cela donne avec la méthode `get` :

   ```php
   public function get($id)
    {
        $values = [
            "idPublication" => $id,
        ];
        $statement = $this->pdo->prepare("SELECT idPublication, message, date, idUtilisateur, login, profilePictureName FROM publications p JOIN utilisateurs u on p.idAuteur = u.idUtilisateur WHERE idPublication = :idPublication");
        $statement->execute($values);
        $data = $statement->fetch();
        if($data) {
            $publication = new Publication();
            $publication->setIdPublication($data["idPublication"]);
            $publication->setMessage($data["message"]);
            $publication->setDate(new DateTime($data["date"]));
            $utilisateur = new Utilisateur();
            $utilisateur->setIdUtilisateur($data["idUtilisateur"]);
            $utilisateur->setLogin($data["login"]);
            $utilisateur->setProfilePictureName($data["profilePictureName"]);
            $publication->setUtilisateur($utilisateur);
            return $publication;
        }
   }
   ```

   Pour la méthode `update`, on doit aller chercher l'identifiant directement dans l'objet utilisateur :

   ```php
    public function update($publication)
    {
        $values = [
            "idPublication" => $publication->getIdPublication(),
            "message" => $publication->getMessage(),
        ];
        $statement = $this->pdo->prepare("UPDATE publications SET message = :message WHERE idPublication = :idPublication;");
        $statement->execute($values);
    }
   ```

   Vous pouvez déjà remplacer les méthodes `get` et `update` avec le code ci-dessus. A partir de ces exemples, vous devez donc mettre à jour les trois autres méthodes...!

6. Vous devez maintenant modifier la méthode `createNewPublication` de `PublicationService`. Rajoutez un paramètre `idUtilisateur`. Cette méthode doit maintenant récupérer l'utilisateur concerné à partir de son identifiant pour l'utiliser dans la méthode `create` de `Publication`! Pour cela, il suffit d'injecter le `service des utilisateurs` dans le `service des publications` et de l'utiliser.

7. Enfin, dans `PublicationController`, modifiez la méthode `submitFeedy`. Il vous faut au préalable aller récupérer l'id de l'utilisateur courant (via le service des utilisateurs) pour le passer an paramètre à la méthode `createNewPublication`.

</div>

Vous pouvez maintenant remplacer votre base `SQLite` par [celle-ci]({{site.baseurl}}/assets/TD4/database_development) et donc réeutiliser votre `environement de développement`!

### Mise à jour du feed

Il ne vous reste plus qu'à mettre à jour le template `feed.html.twig` pour prendre en compte les informations de l'utilisateur attaché à chaque publication. Pour rappel, pour une publication donnée, est récupéré : l'id de l"utilisateur, son login et sa photo de profil. Pour le moment, seuls ces deux derniers éléments vont nous itnéresser.

<div class="exercise">

1. Dans `feed.html.twig`, mettez à jour le span qui affiche `anonyme` pour afficher, à la place, le login de l'utilisateur relié à la publication.

2. Modifiez l'image de profil anonyme pour afficher, à la place la photo de profil de l'utilisateur relié à la publication. Pour rappel, on stocke les photos de profils dans `img/utilisateurs/`.

3. Connectez-vous et tentez d'envoyer des feedies. Vérifiez que toutes les informations sont correctement présentées.

</div>

### Page personnelle

On aimerait que chaque utilisateur dispose d'une page personnelle (visible par tout le monde) listant tous les **feedies** qu'il a publié.

<div class="exercise">

1. Créez un template `page_perso.html.twig` dans `View/Utilisateurs`. Ce emplate reçevra deux variables : `utilisateur` (l'utilisateur concerné par la page) et `publications` (les publicaitons de cet utilisateur)

2. Modifiez le titre de la page pour avoir : **"Page de NomUtilisateur"** (en remplaçant le **NomUtilisateur**, bien entendu).

3. Pour le corps de la page, on doit afficher les **feedies** de l'utilisateur. Vous pouvez donc reprendre tout le `main` de `feed.html.twig`, en excluant le formulaire. Ici, nous dupliquons un peu de code...Il existe un moyen de réutiliser certains bouts de templates en les invoquant, mais nous ne verrons pas cela dans le cadre de ce cours, par manque de temps (vous aurez l'occassion d'explorer `twig` plus n détail avec `symfony`!).

4. Dans `PublicationRepositorySQL`, ajoutez une méthode qui permet de récupérer toutes les publications d'un utilisateur à partir de son identifiant.

5. Dans `PublicationService`, ajoutez une méthode `getPublicationsFrom` qui permet de récupérer toutes les publications d'un utilisateur dont l'identifiant est passé en paramètre.

6. Dans `UtilisateurController`, ajoutez une méthode `getPagePerso` qui prend en paramètre une variable `$idUtilisateur` et récupère l'utilisateur correspondant à cet identifiant puis toutes les publications émises par cet utilisateur (vous allez donc utiliser **deux services**). A partir de ces informations, la méthode renvoie la réponse générée par le rendu du template `Utilisateurs/page_perso.html.twig` en lui fournissant les attributs nécessaires.

7. Enregistrez une nouvelle route `/utilisateurs/page/{idUtilisateur}` uniquement accessible avec `GET`. Il faudra définir un paramètre `idUtilisateur` dans la route (avec une valeur par défaut à `null`). Nommez cette route comme bon vous semble.

8. Testez d'accèder à votre page personnelle (en utilisant votre identifiant d'utilisateur).

9. Dans le template `base.html.twig`, nous aviez laissé le lien `Ma page` en suspens. Il est possible de générer une route paramétrée en utilisant la fonction `route` que nous avions défini dans notre extension `twig`. Par exemple, si on a une route : `/exemple/{var}` nommée `exempleRoute` alors, je pourrais générer un lien paramétré ainsi :

   ```twig
   {% raw %}

   {{ route('exempleRoute', {"var" : 8}) }}

   {% endraw %}
   ```

   Faites en sorte qu'un lien vers la page personnelle de **l'utilisateur courant** (utilisateur connecté géré par la session courante)  soit placé dans le `href` du lien menant vers la page personnelle dans le menu. Pour rappel, l'identifiant de l'utilisateur est accessible via l'objet `session`...!

10. Vérifiez que le lien fonctionne et amène bien sur votre page personnelle. Créez plusieurs comtpes utilisateurs et testez.

11. Maintenant, on aimerait bien qu'un clic sur l'image de l'utilisateur dans `feed.twig.html` amène vers sa page personnelle. Entourez la balise `<img>` de balises `<a>...</a>`. Et défnissez un `href` en utilisant la fonction `route` de manière paramétrée...

</div>

## Gestion des erreurs

Actuellement, nous faisons intégralement confiance au client pour la vérification des données envoyées par le formulaire. C'est une très mauvaise chose! Même si nous mettons des contraintes sur les formulaires, celles-ci peuvent facilement êtres supprimées par le client. Il faut donc toujours **revérifier l'information côté serveur / back-end**.

Aussi, il serait bien d'améliorer la gestion des erreurs pour afficher des messages d'informations à l'utilisateur.

<div class="exercise">

1. Dans `feed.html.twig`, spécifiez une longueur maximale de 250 pour les publications. Spécifiez aussi l'attribut `required` pour rendre ce champ obligatoire.

1. Sur la page d'accueil, en mode connecté, inspectez le formulaire d'envoi des **feedies** (clic droit, inspecter). Editez le champ `HTML` du formulaire dans le navigateur afin de supprimer la restriciton de taille. Publiez ensuite un feedy très long (supérieur à 250 caractères).

</div>

Comme vous pouvez le constater, les vérifications mises en places côté navigateur sont là pour l'ergonomie, mais il est très facile de passer outre. C'est pour cela que le serveur doit lui aussi effectuer une vérification de toutes ces données.

### Une Exception pour les services

Nous allons commencer par créer une `Exception` qui sera levée chaque fois que la couche service détectera une erreur (généralement liée à la vérification / validation des données).

<div class="exercise">

Créez un dossier `Exception` dans `src/Business`. Dans ce dossier, créez une classe `ServiceException` qui hérite de `Exception`. Donnez-lui le bon `namespace`. Il n'y a rien d'autre à faire, pour le moment. Cette `exception` pourra être levée ainsi :

```php
throw new ServiceException("Message d'erreur customisé...");
```

Dès qu'une exception est levée, le programme remonte la pile d'appel pour trouver une fonction qui la traite (avec un bloc `try/catch`).

</div>

### Vérification des données envoyées par le client

Nous allons utiliser notre nouvelle `exception` pour gérer les différentes erreurs liées à la validation et la vérificaiton des données envoyées par le client.

<div class="exercise">

1. Débutons avec un cas particulier : la récupération d'un utilisateur avec `getUtilisateur` dans `ServiceUtilisateur`. Dans certains cas, le fait que celui-ci soit null n'est pas dérangeant et pas considéré comme une erreur (par exemple, quand on regarde que l'utilisateur n'existe pas déjà lors de l'inscription...). Dans d'autres contextes, cette méthode doit absolument retourner une valeur non nulle. Il suffit donc de donner un second paramètre `$allowNull` à cette méthode, avec `true` comme valeur par défaut (donc `$allowNull = true`).

   Si l'utilisateur récupéré est `null` et que le paramètre `$allowNull` vaut `false`, une exception `ServiceException` avec le message `Utilisateur inexistant` doit être levée. Sinon, on retourne simplement l'utilisateur comme auparavant (qu'il osit null ou non).

   Ainsi, on pourra utiliser la méthode de cette manière :

   ```php
   //Ne déclenche pas d'erreur si l'utilisateur n'existe pas
   $utilisateur = $service->getUtilisateur($idUtilisateur); 

   //Déclenche une erreur si l'utilisateur n'existe pas
   $utilisateur = $service->getUtilisateur($idUtilisateur, false); 
   ```

   Faites donc les modificaitons nécessaires sur cette méthode.

2. Appliquez la même logique pour `getUtilisateurByLogin` dans `UtilisateurService`.

3. Pour `createNewPublication` dans `PublicationService` il faut lever une `ServiceException` si le message est vide ou dépassé 250 caractères (avec un message que vous choissirez). Vous pouvez utiliser la méthode `strlen` pour obtenir la taille d'une chaîne de caractères. Une exception doit aussi être levée si l'utilisateur n'existe pas...Pour cela vous pouvez habillement utiliser le paramètre que nous avons mis en place dans les questions précédentes.

4. De même, dans `getPublicationsFrom`, il faut d'abord récupérer l'utilisateur pour voir s'il existe bien et faire en sorte de déclencher une exception si ce n'est pas le cas.

5. Dans `UtilisateurService`, une `ServiceException` doit être levée dans `connexion` si le login et/ou mot de passe sont incorrects (et si l'utilisateur n'existe pas non plus).

6. Enfin, le gros morceau de vérification concerne la création d'un nouvel utilisateur dans `UtilisateurService` :

   * Pour la taille du login, vous pouvez effectuer le même type de vérification que pour le message d'une publication.

   * Pour le mot de passe, vous pouvez vérifier sa conformité par rapport à l'expression régulière que nous avions défini dans le formulaie, grâce à la fonciton `preg_match`. Elle s'utilise ainsi :

      ```php
      //Verifie si $chaine est valide vis-à-vis de l'expression régulière passé en paramètre
      //Il est important de délmiter l'expression avec # #.
      if(!preg_match("#expression#", $chaine)) {
         //Non valide...
      }
      ```

   * Pour l'adresse mail, on peut utiliser un `filtre` de PHP combiné à la fonction `filter_var` qui permet de vérifier cela :

      ```php
      $verif = filter_var($adresse, FILTER_VALIDATE_EMAIL)
      ```

   * Pour l'extension du fichier, on peut regarder si elle est dans le tableau `["png", "jpg", "jpeg"]` grâce à la fonction `in_array` :

      ```php
      $verif = in_array($extension, ["gif", "png", "..."]);
      ```

   * Il faut vérifier, dès le départ, qu'aucune donnée n'est nulle.

   * Il faut vérifier qu'un utilisateur avec le même login n'existe pas déjà...(il faut donc utiliser le `getUtilisateur` en autorisant le `null`, dans ce contexte...)

   * Il faut vérifier qu'un utilisateur avec la même adresse mail n'existe pas déjà...

   Pour chacune de ces vérifications, il faudra donc lever une `ServiceException` avec un message customisé si la condition n'est pas vérifiée...

7. Vérifiez que les exceptions sont bien levées dans différents cas, par exemple si vous rentrez un mauvais login/mot de passe, etc...

</div>

### Les messages flash

Bien sûr, l'objectif n'est pas seulement de lever des exceptions sans les traiter! Le but est de lever ces exceptions dans la **couche services** afin que le controller puisse les traiter et ajouter des messages d'erreur au rendu de la page, sous forme de notifications. Pour cela, nous allons utiliser un mécanisme de `messages flash`.

Les `messages flash` sont des messages temporairement stockés dans la session d'un utilisateur. Ils ont pour but d'être affichés sous la forme de notifications sur la prochaine page chargée.

Les messages flash sont rangés par catégories. Le développeur peut spécifier autant de catégories qu'il souhaite. On utilise pour cela un `AttributeBag` qui agit comme un tableau associatif. Chaque clé de cet objet correspond à une catégorie de flash (`success`, `error`...) qui est associée à un tableau simple contenant les messages de la catgéorie.

```php
//Exemple
$flashBag = new AttributeBag();
$flashBag->set('success', []);
$successFlashes = $flashBag->get('success');
//On ajoute un message au tableau...
$successFlashes[] = "Inscription réeussie!";
//Important : on sauvegarde le nouveau tableau! (car on a obtenu une copie...!)
$flashBag->set('success', $successFlashes);
```

<div class="exercise">

1. Dans `ServerSessionManager`, ajoutez une méthode privée `getFlashBag` qui permet de récupérer le flash bag identifié par la clé `flashes` dans `$this->session`. S'il n'existe pas, il faut alors le créer (`new AttributeBag`) et l'associer à la clé `flashes` dans la session.

2. Ajoutez une méthode `addFlash($category, $message)` qui ajoute un message flash dans le tableau correspondant à `$category` dans le `flash bag`. Vous pouvez notamment utiliser la méthode précédente pour récupérer (et éventuellement initialiser) le `flash bag`.

3. Ajoutez une méthode `consumeFlashes($category)` qui renvoie tous les messages du `flash bag` appartenant à `$category` et supprime le tableau du `flash bag` (supprime l'associaiton définie par la clé `$category`). On peut notamment utiliser cette méthode :

   ```php
   $flashBag->remove($key);
   ```

   Cette méthode permettra à nos `templates` de lire les messages flash et de les supprimer de la session par la même occasion.

4. Dans la classe `Cotnroller`, ajoutez une méthode `addFlash($category, $message)` qui :

   1. Récupère le service `session_manager`.

   2. Ajoute un message flash dans la catégorie passé en paramètre.

   Cette méthode sera alors accessible par tous les controllers.

</div>

Il faut maintenant que nos controllers gèrent les `ServiceException` émissent par la **couche service**. Pour cela, chaque appel d'une méthode pouvant déclencher ce genre d'exception sera traitée ainsi :

```php

try {
   $service->methode();
} catch(ServiceException $exception) {
   ...
}

```

Globalement, dans le `catch`, il s'agira d'ajouter un `message flash` d'erreur à partir de l'exception puis de rediriger / rendre une page :

```php

try {
   //Scénario principal
   $service->methode();
   return $this->render("...", ["..."]);
} catch(ServiceException $exception) {
   //Scénario d'erreur
   $this->addFlash('error', $exception->getMessage());
   return $this->redirect("...");
}

```

<div class="exercise">

1. Dans l'action `submitConnexion` de la classe `ServiceUtilisateur`, placez un bloc `try/catch` gérant une exception `ServiceException` autour de l'appel à la méthode `connexion` sur le service. Dans le bloc `try`, terminez simplement avec la redirection vars la route `feed`, comme précédemment. Dans le bloc `catch`, ajoutez un message flash dans la catégorie `error` en utilisant le emssage de l'exception, puis, redirigez vers la route de la page de connexion.

2. Dans `base.html.twig`, ajoutez le bloc suivant, juste après le `header` :

   ```twig
   {% raw %}
   <div id="flashes-container">
    {% for flash in session.??? %}
        <span class="flashes flashes-success">{{ flash }}</span>
    {% endfor %}
    {% for flash in session.??? %}
        <span class="flashes flashes-error">{{ flash }}</span>
    {% endfor %}
   </div>
   {% endraw %}
   ```

   On veut pouvoir traiter les messages de la catégorie `success` et de la catégorie `error`. Complétez les `???` pour obtenir les messages de ces catégories depuis le session manager (représenté par `session`) et pour qu'ils soient **consommés** (supprimés) après lecture.

3. Sur la page de connexion, rentrez une mot login/mot de passe et tentez de vous connecter. Une notification devrait apparaître!

</div>

Parfait, notre système de notifications fonctionne! Nous allons l'utiliser sur d'autres actions.

<div class="exercise">

1. Sur l'action `submitFeedy`, en cas de `ServiceException`, ajoutez le message de celle-ci comme `flash` de catégorie `error` et redirigez vers la route `feed`.

2. Sur l'action `submitInscription`, en cas de `ServiceException` ajoutez le message de celle-ci comme `flash` de catégorie `error` et générez un rendu en utilisant le template d'inscription (pas de redirection) en passant les paramètres `login` et `adresseMail` au template. 

   En fait, nous allons utiliser ces paramètres dans notre template pour faire en sorte que les champs déjà remplis ne s'effacent pas (sauf le mot de passe, par sécurité) en cas d'erreur. Cela rendra l'utilisaiton du formulaire plus ergonomique.

   Dans le template `inscription.html.twig`, faites en sorte de placer les valeurs attributs `login` et `adresseMail` passés au template dans les champs correspondants. Pour cela, il faut utiliser l'attribut `value` des champs `input`.

3. Toujours dans `submitInscription`, si tout se passe bien (pas d'erreur) ajoutez un message flash "Inscription réeussie!" de la  catégorie `success`.

4. Enfin, dans `getPagePerso`, en cas de `ServiceException`, levez simplement une autre exception `ResourceNotFoundException` (cela redirigera vers une page d'erreur 404 ce qui est plus approprié dans ntore cas).

5. Testez vos ajouts :

   * Tentez d'inscrire un utilisateur avec un login ou une adresse email déjà utilisée.

   * En inspectant la page, modifiez les champs du formulaire d'inscription pour autoriser un login dépassant 20 caractères, vérifiez que cela ne passe pas.

   * Créez un nouveau comtpe, observez la notificaiton de succès.

   * Sur le feed, en inspectant la page, modifiez les restrictions du formulaire d'envoi des publications. Tentez d'envoyer un long message et vérifiez que cela ne fonctionne pas.

   * Tentez d'accèder à une page d'un utilisateur qui n'existe pas.

   * Tout ce qu'il vous passe par la tête...!

</div>

## Conclusion

Nous approchons de la fin! Notre framework devient de plus en plus complet, et notre application est assez fonctionnelle! Nous allons, dans le prochain (et dernier) TD :

   * régler les problèmes de `sécurité` et d'accès aux `routes` (par exemple, la route /connexion est toujours accessible, même si on est connecté).

   * gérer des `événements` pour avoir des pages d'erreurs customisées.

   * mettre en place les bases d'une petite `API REST` couplé avec du `Javascript` afin de rendre notre site plus dynamique.
