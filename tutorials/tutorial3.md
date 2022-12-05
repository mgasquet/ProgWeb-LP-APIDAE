---
title: TD3 &ndash; Création d'un framework 2/2
subtitle: Twig, MVC, Framework, Symfony, Injection de dépendances, Configuration, Environnements
layout: tutorial
lang: fr
---

## Démarrage

Pour sauvegarder votre progression TD par TD, il est conseillé de recréer un nouveau dossier pour chaque TD et d'y copier le contenu réalisé lors du précédent TD.

A l'aide de PHPStorm créez dond un nouveau projet vide dans le dossier `public_html/TD3` 
de votre répertoire personnel. 
Pour ceci, sélectionnez `New Project`, `PHP Empty Project`, Location: `/home/licence/votre_login/public_html/TD3`.

Copiez le contenu de votre dossier `TD2` dans `TD3`.

Vérifiez que l'URL suivante donne bien accès à votre site : 

[http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD3/addition/5/10](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD3/addition/5/10).

Attention, dorénavant, il faudra bien vérifier que `TD3` est dans l'URL! (et que vous n'êtes pas revenu sur une URL du TD2 ou du TD1 par erreur).

## Le conteneur de services

Dans un logiciel, nous avons besoin d'accèder à différentes instances d'objets importants : les **services**, les **repositories**, et divers autres classes qui effectuent des traitements essentiels pour le bon fonctionnement de notre application. Mais comment faire pour rendre ces instances accessibles à ceux qui ont en besoin facilement ?

Une première solution pourrait consister à transformer toutes ces classes en **singleton**. Ainsi, elles seraient accessibles n'importe où dans le code, via la méthode **getInstance**. Or, cela créé deux problèmes :

   * Le singleton inclut qu'il n'y peut y avoir qu'une seule instance de cette classe. Que faire si on a besoin d'accèder à plusieures instances de cette classe, paramétrée différment ?

   * Le code utilisant le singleton devient dépendant d'une instance en particulier. Si on voulait changer d'instance de cet (objet par exemple : utiliser des repositories XML à la place de SQL) il faudrait changer toutes les portions de code qui utilisaient le singleton...

Ce n'est donc pas une très bonne solution. Globalement, une bonne architecture implique que :

   * Les différentes classes ne dépendent pas d'instances d'autres classes en particulier, mais plutôt d'une **interface** (ou d'une **classe abstraite**) qui pourra prendre des formes différentes grâce au **polymorphisme** sans avoir besoin de changer le code de la section utilisant ce composant.

   * Les **instances** concrètes sont **injectées** dans les classes qui doivent utiliser un service. Cela peut se faire sous la forme de **setters** ou bien directment comme arguments pour le **constructeur** de l'objet. Cela renforce l'indépendance des classes. La classe n'instancie pas elle-même les composants dont elle a besoin, ils sont **injectés** depuis l'extérieur. On appelle cela **l'inversion de contrôle**.

   * Il est possible d'utiliser la même instance et de l'injecter dans différentes classes. En fait l'instance n'est initialisé qu'à un seul endroit. Cela facilite donc également sa contruction nécéssite différents paramètres. Il est également possible de générer plusieurs instances du service et de sélectionner lequel est injecté dans quel classe.

Par exemple, imaginons l'ensemble de classes suivant :

```php
class ServiceV1 {

   private str $a;

   public function __construct(str $a) {
      $this->a  = $a;
   }

   public function action() {
      ...
   }

}

class ServiceV2 {

   private int $b;

   public function __construct(int $b) {
      $this->b  = $b;
   }

   public function action() {
      ...
   }

}

class A {

   private ServiceV1 $service;

   public function __construct() {
      $this->service = new Service1("test");
   }

   public function executeA() {
      $this->service->action();
   }

}

class B {

   private ServiceV1 $service;

   public function __construct() {
      $this->service = new Service1("test");
   }

   public function executeB() {
      $this->service->action();
   }

}
```

Ici, `ServiceV1` et `ServiceV2` ne se construisent pas de la même manière mais possèdent toutes les deux une méthode `action`. Les classes `A` et `B` n'ont normalement pas besoin de savoir comment se construisent ces services. Fondamentalement, elle n'utilise que la méthode `action`...De plus, le service est instancié deux fois dans deux classes différentes. Si jamais nous souhaitons changer le service utilisé par `ServiceV2` il faudra changer le code de ces deux classes...

Il est alors possible d'adopter l'architecture suivante pour règler ce problème :

```php
interface ServiceInterface {

   public function action();

}

class ServiceV1 implements ServiceInterface {

   private str $a;

   public function __construct(str $a) {
      $this->a  = $a;
   }

   public function action() {
      ...
   }

}

class ServiceV2 implements ServiceInterface {

   private int $b;

   public function __construct(int $b) {
      $this->b  = $b;
   }

   public function action() {
      ...
   }

}

class A {

   private ServiceInterface $service;

   public function __construct(ServiceInterface $service) {
      $this->service = $service;
   }

   public function executeA() {
      $this->service->action();
   }

}

class B {

   private ServiceInterface $service;

   public function __construct(ServiceInterface $service) {
      $this->service = $service;
   }

   public function executeB() {
      $this->service->action();
   }

}

//Plus loin, lors de l'initilisation de l'application :

$service = new ServiceV1("test");
$a = new A($service);
$b = new B($service);
```

Comprenez-vous la différence entre ces deux architectures? Dorénavant, quand si nous souhaitons changer le service utilisé par `ServiceV2`, il n'y a qu'une seule ligne de code à changer, et les classes `A` et `B` n'auront pas à être modifiées. On pourrait aussi utiliser plusieurs services différents à la fois, si besoin :

```php
$serviceV1 = new ServiceV1("test");
$serviceV2 = new ServiceV2(5);
$a = new A($serviceV1);
$b1 = new B($serviceV1);
$b2 = new B($serviceV2);
```

Cette architecture permet de respecter un principe essentiel en génie logiciel : **le principe ouvert/fermé** : L'application à la capacité d'e^tre étendu et on peut facilement étendre son comportement (**ouvert**) : par exemple, ici, on peut facilement rajouter un nouveau service et l'injecter aux classes qui ont en besoin. Et de l'autre côté, les extensions apportées n'apportent pas de changement au code (**fermé**) : Malgré l'ajout d'un nouveau de service ou le changement de service utilisé, le code de `A` et `B` reste inchangé.  
Notre code est donc assez **resitant au changement**.

Tout cela nous amène aux **5 principes SOLID** qu'une bonne applicaiton se doit de respecter :

   * Single responsibility principle : Une classe (et ses méthodes) ne doit avoir **qu'une seule responsabilité** (par exemple, le repository des publications `PublicationRepository` ne gère que le stockage des publications...la méthode `getAll` récupère toutes les publications et pas d'autres choses selon les paramètres utilisés...)

   * Open/closed principle : Le principe ouvert/fermé dont nous venons de parler.

   * Liskov substitution principle : Une instance d'un objet peut être remplacée par une autre sans modifier la cohérence du programme. C'est le cas ici avec nos deux services qui peuvent êtres intervertis dans les classes `A` et `B` sans en modifier le code.

   * Interface segregation principle : Préférer avoir des interface spécifiques plutôt qu'une grosse interface générale. Une classe dépendant d'un type interface ne devrait pas avoir accès des méthodes dont il ne se servira pas.

   * Dependency inversion principle : Les classes doivent plutôt dépendre d'abstractions (classes abtraites ou interfaces) plutôt qu'une classe cocnrète (ce qui facilite le **Liskov substitution principle**). C'est le cas ici dans la deuxième architecture de `A` et `B` où ces deux classes ne dépendent plus d'une des classes cocnrète `ServiceV1` ou `ServiceV2` mais plutôt de l'interface `ServiceInterface`.

Un bon framework se doit donc de proposer une architecture respectant les principes **SOLID**. Généralement, pour gérer tout cela, on peut utiliser le **design pattern** appellé **Factory**, généralement couplé avec **Abstract Factory**. L'objectif d'une **factory** est de gérer les instances des différents objets mis à disposition des classes, ainsi que l'injection des dépendances. Une **Abstract Factory** va permettre de choisir un sous-type concret de **Factory utilisé**.  
Par exemple, on pourrait imaginer m'architecture suivante :

```php
interface FirstServiceInterface {

   public function action();

}

interface SecondServiceInterface {

   public function getResult() : int;

}

class FirstServiceV1 implements FirstServiceInterface {

   private str $a;

   public function __construct(str $a) {
      $this->a  = $a;
   }

   public function action() {
      ...
   }

}

class FirstServiceV2 implements FirstServiceInterface {

   private int $b;

   public function __construct(int $b) {
      $this->b  = $b;
   }

   public function action() {
      ...
   }

}

class SecondServiceV1 implements SecondServiceInterface {

   private str $a;

   public function __construct(str $a) {
      $this->a  = $a;
   }

   public function getResult() : int {
      ...
   }

}

class SecondServiceV2 implements SecondServiceInterface {

   private int $b;

   public function __construct(int $b) {
      $this->b  = $b;
   }

   public function getResult() : int {
      ...
   }

}

class A {

   private FirstServiceInterface $serviceA;
   private SecondServiceInterface $serviceB;

   public function __construct(FirstServiceInterface $serviceA, SecondServiceInterface $serviceB) {
      $this->serviceA = $serviceA;
      $this->serviceB = $serviceB;
   }

   public function execute() {
      $this->serviceA->action();
      $result = $this->serviceB->getResult();
      return $result;
   }

}

abstract class AbstractServiceFactory {

   private static $instance = null;

   public function getInstance() {
      if($instance == null) {
         AbstractServiceFactory::$instance = new FactoryV1();
      }
      return $instance;
   }

   public abstract function getFirstService() : FirstServiceInterface;

   public abstract function getSecondService() : SecondServiceInterface;

}

class FactoryV1 implements AbstractServiceFactory {

   private FirstServiceInterface $serviceA;
   private SecondServiceInterface $serviceB;

   protected function __construct() {
      $this->serviceA = new FirstServiceV1("test");
      $this->serviceB = new SecondeServiceV1("test");
   }

   public function getFirstService() : FirstServiceInterface {
      return $this->serviceA;
   }

   public function getSecondService() : SecondServiceInterface {
      return $this->serviceB;
   }

}

class FactoryV2 implements AbstractServiceFactory{

   private FirstServiceInterface $serviceA;
   private SecondServiceInterface $serviceB;

   protected function __construct() {
      $this->serviceA = new FirstServiceV2(10);
      $this->serviceB = new SecondeServiceV2(50);
   }

   public function getFirstService() : FirstServiceInterface {
      return $this->serviceA;
   }

   public function getSecondService() : SecondServiceInterface {
      return $this->serviceB;
   }

}


//Plus loin, lors de l'initilisation de l'application :

$factory = AbstractServiceFactory::getInstance();
$serviceA = $factory->getFirstService();
$serviceB = $factory->getSecondService();
$a = new A($serviceA, $serviceB);
```

Dans cette architecture, il est aisé de changer de "famille de services" (de V1 à V2) en changeant la factory utilisée dans `AbstractServiceFactory`. Généralement, cela est plutôt configuré via un fichier de configuration (pas de modificaiton de code direct...) mais nous y reviendrons.

Dans notre **framework**, nous n'allons pas utiliser explicitement des **factories** mais plutôt un composant nommé **conteneur de services**. Ce composant permet de créer, en quelque sorte une **factory dynamique**. On configure nous-même les services qui seront proposés par le conteneur. Chaque service est alors identifié avec une chaîne de caractères et il est possible de les récupérer à tout moment via le conteneur. De plus, nous n'instancions pas nous-même le service. C'est le conteneur qui s'en chargera lors du premier accès au service par l'application (on appelle cela le **lazy loading**) et réalisera l'injection des dépendances que nous auront indiqué.

Dans notre framework, nous utiliserons le conteneur de services de **Symfony** : `ContainerBuilder`. Regardons de plus près les méthodes qui vont nous intéresser :

```php
//Instanciation
$container = new ContainerBuilder();

//Enregistrement du service "serviceName" qui représente la classe concrète MyService
$container->register('service_name', MyService::class)

//Recuperation de l'instance service :

$myService = $container->get('service_name');

//Enregistrement d'un service qui a besoin de paramètres pour être intialisé.
//L'injection est faite via le constructeur
$serviceReference = $container->register('service_bis', MyServiceBis::class)
$serviceReference->setArguments([5, "test"]);
//Le constructeur de MyServiceBis attend donc un entier et une chaîne de caractères...!
```
La méthode register renvoie une **référence du service** (et pas une instance du service). Il est donc possible de préciser divers paramètres comme les arguments du constructeur, des méthodes à éxécuter après initialisation...

On peut également entegistrer des **paramètres** (variables globales) dans le conteneur :
```php
$container->setParameter('param_one', "hello");
```

Maintenant, quelquechose d'un peu plus avancé :

```php
$serviceReference = $container->register('service_third', MyServiceThird::class)
$serviceReference->setArguments(["%param_one%", new Reference("service_bis")]);
$serviceReference->addMethodCall('setup', [10, false]);
$serviceReference->addMethodCall('machin', []);
```

Dans les paramètres inejectés dans le service, on peut :  
   * Faire référence à un paramètre contenu dans le conteneur, en utilisant les marqueurs `%nom_parametre%`  
   * Faire référence à un autre service du conteneur (même s'il n'est pas encore enresgitré!). On utilise pour cela un objet `Reference` paramétré avec le nom du service.

La fonction `addMethodCall` permet de défnir une méthode à appeler sur le service après son initialisation. On lui passe le nom de la méthode à éxécuter et ses paramètres sous la forme d'un tableau. Là aussi, si besoin, on peut faire réféence à un paramètre ou à un autre service.

Après enregistrement et configuration, à partir du **conteneur**, on peut donc récupérer n'importe quel service grâce à la méthode `get`. Le but du conteneur va être d'intiialiser et d'enregsitrer les différents services en injectant les dépendances necessaires au beau endroit. Ensuite, il sera pricnipalement utilisé par les **controllers** pour accèder aux divers services de l'application. Pour els autres classes qui dépendent de services bien précis, ces dépendances seront directement injectées via le conteneur.

Quand on y regarde de plus près, ce conteneur est alors une grande **factory** regroupant tous les services de l'application. On passe par elle pour récupérer l'instance qui nous intéresse. Si on veut changer l'instance utilisée pour un service, il suffit alors de changer la classe spécifiée à un seul endroit, lors de la configuraiton du conteneur.

### Initialisation de l'application

Pour commencer, nous allons créer une classe qui servira à initialiser notre application. Son rôle sera de générer et paramétrer le `conteneur de services` en enregistrant tout ce dont nous avons besoin. C'est aussi ici que seront configurées les routes de l'application.

<div class="exercise">

1. Dans le repertoire `src`, créez une classe `TheFeed` et donnez-lui le bon `namespace`.

2. Ajoutez une méthode `initializeApplication` qui devra (pour l'instant) instanciez un objet `ContainerBUilder` et le retourner. Pour importer la bonne classe, vous pouvez passer la souris au dessus du nom et sélectionner l'action `import class` de PHPStorm.

3. Déplacez tout le code gérant la création des routes et l'instanciation de la classe `AppFramework` (et de ses dépendances) depuis `app.php` vers cette nouvelle méthode. Votre fichier `app.php` va contenir des erreurs, c'est normal, car il essaye d'utiliser une instance de `AppFramwrok` qui n'est plus là! Laissez comme ça pour le moment, nous allons régler cela dans le prochain exercice.

4. Dans `app.php`, importez la classe `TheFeed`, instanciez-là dans une variable `$app` et ajoutez une ligne qui appelle la méthode précédemment définie afin de récupérer le **conteneur de services** dans une variable `$container`.

</div>

### Injection des dépendances du framework

Nous avons notre fonction d'intiialisation, mais nous instancions toujours directement le framework et ses différentes dépendances...De plus, notre classe `AppFramework` utilise des classes concrètes! Cela ne respecte pas les principes **SOLID**...De plus, il faut que `app.php` puisse accèder au `framework` ce qui n'est plus possible, présentement. Nous allons remédier à cela :

<div class="exercise">

1. Changez les dépendances de `AppFramework` de : `UrlMatcher`, `ControllerResolver`, `ArgumentResolver` à `UrlMatcherInterface`, `ControllerResolverInterface`, `ArgumentResolverInterface`. Ainsi, à l'avenir, il sera plus aisé de changer de type concret utilisé, si besoin, sans toucher au code de `AppFramework`. 

2. A la place de les instancier directement, enregistrez `RequestContext`, `UrlMatcher`, `ControllerResolver`, `ArgumentResolver` et `AppFramework` comme services du container dans la fonction `initializeApplication` de `TheFeed`. Vous leur donnerez les noms suivants : `context`, `matcher`, `argument_resolver`, `controller_resolver` et `framework`. N'oubliez pas d'utiliser l'objet `Reference` pour faire référence à un autre service!

3. Dans `app.php`, à l'aide de la variable `$container` récupérée, récupérez l'instance du service nommé `framework`. Ensuite, traitez la requête avec cet objet, comme précédemment. (cela doit fixer les erreurs présentes dans ce fichier)

4. Vérifiez que tout fonctionne bien en testant les routes que vous aviez créé précédemment.
</div>

### Ajout de twig

Maintenant que nous disposons d'un containeur de services nous allons pouvoir enregistrer divers services externes comme `Twig`.

<div class="exercise">

1. Reprenez le code utilisé pour instancier `Twig` dans `feed.php` et copiez le dans la fonction `initializeApplication` de `TheFeed`.

2. Adaptez le code pour enregistrer `Twig` comme service au lieu de l'instancier directement. Pour cela il vous faut :

   * Initialiser le `$twigLoader` (`FilesystemLoader`) en précisant où se trouvetn les templates. Ce dossier ce situe maintenant dans `__DIR__."/View"`.

   * Enregistrer le service `twig` en utilisant la classe `Environment` de twig.

   * Definir comme arguments de ce service : Le `$twigLoader` et le tableau de paramètres : `["autoescape" => "html"]`.

3. Rechargez une de vos pages et vérifiez qu'il n'y a pas d'erreurs.

</div>

Nous aurons l'occassion d'utiliser Twig dans notre application très prochainement.

## De meilleurs controllers

Chaque **controller** a potentiellement besoin d'accèder à différents services (services gérant les entités, twig, ...). Il serait donc bien que nous puissions trouver un moyen de donner accès au **conteneur de services** à tous les controllers de notre application.

### Enregistrement des controllers comme des services

Premièrement, il est plutôt fastidieux de recopier toute le "chemin" de la classe du controller chaque fois que nous voulons enregsitrer une route qui l'utilise. Pour remédier à cela, il suffit d'enregsitrer les controllers comme des services! Il faudra néamoins changer le `ControllerResolver` en `ContainerControllerResolver` qui est une extension qui permet d'aller trouver les controllers correspondant grâce à leur nom de service dans le containeur.

Par la suite, dans la **route**, il suffit d'indiquer le nom de service associé au controller. Par exemple :

```php
$container->register('first_controller', FirstController::class)

$route = new Route('/test', [
   '_controller' => 'first_controller::fonction'
]);
```

<div class="exercise">

1. Enregsitrez `TestController` comme un service du conteneur ayant pour nom `test_controller`.

2. Modifiez l'enregistrement du service `controller_resolver` en utilisant la classe concrète `ContainerControllerResolver`. Il faudra aussi donner en argument pour la construction de se service le `$container` (avec `setArguments`).

3. Modifiez vos **routes** afin qu'elles utilisent le **service** `test_controller`.

4. Testez vos différentes **routes** pour vérifier que tout fonctionne bien.

</div>

### Injection du conteneur de services

Nous aimerions maintenant que le conteneur deservices soit systmétiquement injecté dans nos controllers. Cela tombe bien, maintenant que nos controllers sont des services, on peut donc leur injecter de dépendances!

Comme cette opération sera commune à tous les controllers, nous allons créer une **classe abstraite** de controller pour notre framework qui permettra de définir un constructeur accueillant un **conteneur**. Cette classe centralisera aussi diverses opérations utiles pour tous les controllers.

<div class="exercise">

1. Créez une classe **abstraite** `Controller` dans `external/Framework/Application` (novueau dossier). Donnez-lui le bon `namespace`.

2. Donnez à cette classe un attribut **protected** de type `ContainerInterface` nommé `$container`. Attention à bien sélectionner le `ContainerInterface` de Symfony lors de l'import.

3. Créez un constructeur qui prend un `ContainerInterface` en paramètre et permet d'initialiser l'attribut correspondant.

4. Faites en sorte que votre classe `TestController` hérite de `Controller` (mot clé `extends`).

5. Dans la méthode de votre classe `TheFeed`, injectez le **container de services** quand vous enregsitrez le service `test_controller`.

6. Vérifiez que tout fonctionne toujours en testant une de vos routes.

</div>

### Utilisation de twig

Maintenant que nos **controllers** ont accès au **conteneur de services** ils peuvent notamment accèder à `Twig`! Cela va nous être utile pour générer la page HTML en réponse à une requête. Nous allons donc doter notre classe abstraite `Controller` d'une méthode permettant de déclencher un rendu `Twig`.

<div class="exercise">

1. Créez une méthode `render` dans la classe `Controller` qui prend deux paramètres `$twigPath` et `$arguments`. Cette méthode doit :

   * Récupérer le code généré par le template twig designé par `$twigPath` en lui fournissant les arguments du tableau `$arguments`.

   * Retourner un objet `Response` ayant pour contenu le cpde généré par `twig`.

Pour rappel, le service `twig` est accessible via le `container` dont le controller dispose!

2. Créez un template `test.html.twig` dans le dossier `src/View`. Codez une architecture HTML simple dans ce fichier, avec un `<body>...</body>` affichant une variable ```{% raw %}{{ message }}{% endraw %}```.

3. Dans les trois méthodes de votre classe `TestController`, remplaçez la valeur retournée par un appel à la fonction `$this->render` en utilisant le template `test.html.twig` et en donnant pour les arguments un **tableau associatif** associant la clé `message` à la valeur calculée dans l'action (le "coucou", le "Resultat = ...", le "Je m'appelle...").

4. Testez vos routes et vérifiez que le template est bien utilisé! (vous pouvez notamment visionner le code HTML en faisant `CTRL+U`).

</div>

### Redirection

Maintenant, on aimerait bien qu'une action d'un controller puisse rediriger vers une autre route (et donc ue atre URL) après son traitement (par exemple, que le fait de poster une nouvelle publication redirige vers la page des publications ensuite).

Pour cela, nous allons créer une **méthode de redirection** dans notre classe `Controller`. Nous allons nous aider d'un service nommé `URLGenerator` qui permet de générer un lien à partir d'un nom de route. Il s'utilise ainsi :

```php
$url = $generator->generate($routeName, $args);
```
Le `$args` désigne un tableau associatif que l'on peut préciser si la route à besoin de paramètres (par exemple, si on redirige vers la route `/addition/{a}/{b}`).

<div class="exercise">

1. Dans la fonction `initializeApplication` de `TheFeed` enregistrez un nouveau service nommé `url_generator` qui sera paramétré avec la classe `URLGenerator`. Tout comme un `URLMatcher`, `URLGenerator` doit être paramétré avec un `RequestContext`. Précisez donc cet arhumets lors de l'enregistrement du service en faisant référence au service `context` enregistré plus tôt.

2. Créez une méthode `redirectToRoute` dans la classe `Controller` qui prend deux paramètres : le nom de la route `$routeName` et les éventuels arguments `$arguments`. Le paramètre `$arguments` devra avoir la valeur par défaut `[]` (tableau vide). Pour cela, il suffit de préciser `$arguments = []` dans la déclaration de la fonction. Cela permet de ne pas avoir à préciser ce paramètre s'il ny a pas de paramètres à transmettre à la route.

3. Faites en sorte que cette méthode :

   * Récupère l'URL correspondant au nom de la route et aux arguments passés en paramètre en utilisant le service `url_generator`.

   * Retourne un objet `RedirectResponse` qui contient l'URL généré. L'objet `RedirectResponse` est simplement une réponse qui redirige vers une autre URL.

4. Créez une nouvelle **route** ayant pour chemin `/test/redirect` qui appelle une nouvelle méthode `testRediriger` dans le controller `TestController` qui redirige simplement vers une de vos routes. Il faudra donc utiliser la méthode `$this->redirectToRoute` fraîchement créée. Pour le nom des routes, il s'agit du nom que vous avez donné lors de l'ajout à votre collection de routes.

5. Testez la route `/test/redirect` et vérifiez que vous êtes vien redirigé!

6. Maintenant, créez une simple méthode `redirectTo` dans `Controller` qui prend une URL en paramètre et retourne une `RedirectResponse` redirigeant vers cette URL.

7. Refactorez le code de `redirectToRoute` pour utiliser cette nouvelle méthode au lieu de retourner dirctement la `RedirectResponse`. Testez que tout est toujours fonctionnel.

</div>

## Le Manager de repositories

Nous allons maintenant nous intéresser à la **couche stockage** et la manière de l'organiser à travers notre framework. Nous allons pour cela construire un `manager de repositories` qui agira un peu comme le `conteneur de services` mais dont le rôle sera d'instancier et référencer les différents `repositories` utilisés par l'application.

L'idée est simple :

   * Chaque repository est relié à une source de données particulière qui s'utilise de la même manière. Par exemple, à travers l'objet `PDO` pour une base de données utilisant `SQL`.

   * Le rôle d'un `manager de reposiotires` sera de stocker les données à injecter aux repoisotires, de les instancier et de les associer à un `entité` (pour savoir que pour gérer le stockage de telle entité il faut tel repository...).

   * Il peut y avoir un manager de repository par source de données : Un pour SQl, un pour XML, un pour CSV...

   * Cela implique donc d'avoir une `interface` ou une `classe abstraite` pour généraliser les méthodes accessibles à travers ces managers.

### Des interfaces

Commençons tout d'abord par créer la classe abstraite `RepositoryManager` qui définira les méthodes de ce genre de composant ainsi que l'interface `Repository` qui définira les méthodes `CRUD` qu'un repository doit implémenter.

<div class="exercise">

1. Créez un repertoire `Storage` dans `external/Framework`.

2. Créez une `classe abstraite` nommée `RepositoryManager` dans `Storage` :

   ```php
   abstract class RepositoryManager {

      protected $respositories = [];

      public abstract function registerRepository($entityClass, $repositoryClass);

      public function registerRepositories($repositoriesData) {
         ...
      }

      public function getRepository($entityClass) {
         ...
      }
   }
   ```

   * La méthode `registerRepository` est abstraite et consiste à relier la classe d'une entité (`$entityClass`) à une instance d'un repository. Le repository est instancié à ce moment là, grâce à la classe spécifiée en paramètre (`$repositoryClass`). L'association entre la classe de l'entité et l'instance du repository est stockée dans le tableau `$this->respositories`. Cette méthode dépend de la classe concrète utilisée car les paramètres d'itnitialisation ne seront pas les mêmes selon la nature du repository manager (`$pdo` pour du SQL, un document pour du XML, etc...)

   * La méthode `registerRepositories` est très simple. Elle prend en paramètre un tableau associatif `$repositoriesData` qui contient des associations entre des classes d'entités et des classes de repositories. Il suffit alors de parcourir le tableau avec un `foreach` pour enregistrer l'association avec `registerRepository`.

   * La méthode `getRepository` renvoie simplement l'instance de `repository` correpondant à la classe `$entityClass` passée en paramètre. Il suffit alors de lire dans le tableau associatif `$this->respositories`.

3. Implémentez les méthodes `registerRepositories` et `getRepository`. Pour rappel, on peut accèder à la clé et la valeur associée quand on parcourt un tableau associatif avec un `foreach` :

   ```php
   foreach($tabAssociatif as $key => $value) {
      ...
   }
   ```

4. Toujours dans le dossier `external/Framework/Storage` créez une interface `Repository`. Donnez-lui le bon namespace et spécifiez les 5 signatures de méthodes suivantes, qui correspondent aux opérations `CRUD` :

   ```php
    public function getAll();
    public function get($id);
    public function create($entity);
    public function update($entity);
    public function remove($entity);
   ```

</div>

### Un repository pour les bases utilisant du SQL

Nous allons maintenant créer un `repository manager` concret permettant gérer des repositories utilisant `MySQL` avec `PDO`.

<div class="exercise">

1. Toujours dans le dossier `Storage` du framework, créez un repertoire `SQL` et créez une classe `RepositoryManagerMySQL` à l'intérieur. Donnez-lui le bon `namespace` et faites-la hériter de `RepositoryManager`.

2. Ajoutez un attribut privé `$pdo` de type `PDO` et un constructeur prenant en paramètre un tableau `$databaseConfiguration` et qui initialise l'attribut `$pdo` en utilisant les informations contenues dans ce tableau. Si vous ne vous souvenez plus comment faire, allez consulter les anciennes classes que vous aviez codé : `ConnexionMySQL` et `Conf`.

3. Implémentez la méthode `registerRepository` de manière à ce que :

   * On crée une instance de la classe représentée par `$repositoryClass` en utilisant comme paramètre l'objet `$this->pdo` (cela est valide car notre manager gère des repositories SQL). PHP est un langage assez (trop?) permissif et permet de faire cela simplement à partir d'une variable stockant une classe (ou un nom de classe) ainsi : `$maVar = new $varClass(param1, param2, ...);`.

   * Dans le tableau associatif `$this->repositories`, on associe la classe représentée par `$entityClass` à l'instance de `$repositoryClass` créée à l'étape précédente.

</div>

### Retour du repository des publications

Nous allons doucement commencer à mettre à niveau ce que nous avions produit pour l'application `The Feed`. 

<div class="exercise">

1. Copiez votre ancienne classe `PublicationRepositorySQL` dans le dossier `src/Storage/SQL`. 

2. Donnez-lui le bon `namespace` et faites-la implémenter l'interface `Repository` (mot clé `implements`). Il ne devrait rien y avoir à changer car votre classe implémente déjà toutes les méthodes nécessaires!

</div>

### Ajout du manager SQL dans le conteneur de services

Nous allons maitnenant ajouter notre `RepositoryManagerMySQL` comme un `service` dans le conteneur et nous allons aussi enregistrer le `PublicationRepositorySQL` comme repository gérant l"entité `Publication`.

<div class="exercise">

1. Dans la méthode `initializeApplication` de la classe `TheFeed`, enregistrer le service `repository_manager` en utilisant comme classe concrète `RepositoryManagerMySQL`. Il faudra que le conteneur de service injecte le tableau contenant les paramètres de connexion à la base de données dans ce service. Vous pouvez pour cela reprendre le tableau que vous aviez défini dans l'ancien fichier `Conf.php` (prenez directement le tableau et utilisez le dans la fonction, n'utilisez pas de fichier annexe comme avant).

2. En utilisant la méthode `addMethodCall`, faites en sorte que la méthode `registerRepository` soit appellée lors de l'initilisation du service en utilisant comme paramètre `Publication::class` et `PublicationRepositorySQL::class`. Cela aura pour effet de créer l'association entre l'entité et ce repository quand le manager sera initialisé par le conteneur. Ainsi, plus tard, si on souhaite accèder à ce repository, on fera :

   ```php
   $repository = $repositoryManager->getRepository(Publication::class);
   ```
</div>

## Mise à niveau de "The Feed" avec le nouveau framework

Notre framework devient assez complet! Nous allons pouvoir complétement mettre à niveau ce que nous avions précédemment réalisé pour `The Feed` en utilisant ce nouvel outil! Pour la suite, cela structurera et facilitera l'évolution de notre application.

### Import des templates

Il faut tout d'abord importer les templates `twig` et nos `assets`.

<div class="exercise">

1. Dans le dossier `web/assets`, créez un dossier `css` et aun dossier `img`. Dans le dossier `css` copiez le fichier `styles.css` et dans `img` l'image `anonyme.jpg`.

2. Copiez le template `base.html.twig` ainsi que que le dossier `Publications` et son template `feed.html.twig` dans le dossier `src/View`.

3. Dans les deux templates importés, adaptez la ligne d'import des assets (css, images...) pour viser le dossier `./assets/css/styles.css` et `./assets/img/anonyme.jpg`. En effet, nous partons du dossier `web` quand nous utilisons une route simple (`/chemin`). Il faut donc viser, à partir de la position courante le sous-dossier `assets`, relativement. Néamoins, cette solution ne marchera plus quand la route sera plus complexe (`/chemin/souschemin1/...`). Nous verrons comment régler ce problème plus tard.

</div>

### Un controller pour les publications

Il est temps de créer le `controller` qui gérera les actions liées aux `publications` (nos **feedies**).

<div class="exercise">

1. Dans `src/Application` créez une classe `PublicationController`. Donnez le bon `namespace` et faites-là hériter de la classe adéquate.

2. Enregistrez ce `controller` dans le conteneur de services sous le nom `publication_controller` (à l'endroit habituel). N'oubliez pas de lui injecter le `conteneur`! (comme pour `test_controller`)

3. Dans `PublicationController`, créez une méthode `feed` qui :

   1. Accède au `repository manager` via le conteneur de service.

   2. Accède au `repository` gérant les **publications** via les `repository manager`.

   3. Récupère toutes les publications dans une variable.

   4. Retourne une réponse générée en utilisant le template `twig` designé par `Publications/feed.html.twig` en donnant le tableau d'arguments adéquat. Pour rappel, ce template attend que vous lui donniez une variable `publications` pointant sur le tableau contenant toutes les publications. Jetez un oeil dans votre ancien fichier `feed.php` si vous ne vous souvenez pas. N'oubliez pas d'utiliser la méthode `$this->render`...!

4. Dans `PublicationController`, créez une méthode `submitFeedy` qui prend un objet `Request $request` en paramètre et qui :

   1. Récupère la donnée `message` envoyée par formulaire et stockée dans l'objet `$request` (pour rappel, on utiliser la méthode `get`, voir la méthode `afficheInfos` de `TestController` pour plus de détails).

   2. Créé une nouvelle `Publication` (en utilisant la méthode statique `Publication::create`) en utilisant le message récupéré à l'étape précédente et le login `anonyme`.

   3. Accède au `repository manager` puis au `repository` des publications, comme précédemment.

   4. Sauvegarde la nouvelle publication dans la base en utilisant le repository.

   5. Redirige vers la route `"feed"` (que nous allons créer dans le prochain exercice).

</div>

### Mise en place des routes

Il faut maintenant créer les `routes` qui permettront d'accèder à ces actions.

<div class="exercise">

1. Dans la classe `TheFeed`, dans la méthode d'initialisation, supprimez (ou plutôt commentez) vos anciennes routes et l'enregistrement du controller `test_controller`.

2. Enregistrez une route sous le nom `feed` ayant pour chemin `/` et visant l'action `feed` du controller `PulciationController`. Pour rappel, le controller est maintenant un `service` nommé `publication_controller`.   
Cette méthode ne devra être accessible qu'avec la méthode `GET`.

3. Enregistre une route sous le nom `submit_feedy` ayant pour chemin `/feedy` et visant l'action `submitFeedy` du controller `PulciationController`.  
Cette méthode ne devra être accessible qu'avec la méthode `POST`.

4. Testez d'afficher votre site : [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD3/web/](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD3/web/)  
Il devrait maintenant s'afficher comme il faut!

5. Vérifiez que l'envoi d'une nouvelle publication via le formulaire fonctionne.

</div>

## La couche service

Notre application fonctionne bien, mais le controller a un peu trop de responsabilités! Il ne devrait devoir  lui-même chercher (ou sauvegarder) les données dans le repository des publications. Nous allons plutôt déléguer cette tâche à un `service`.

### Une classe de service intermédiaire pour les publications

<div clss="exercise">

1. Créez une classe `PublicationService` dans `src/Business/Services` et donnez-lui le bon `namespace`.

2. Donnez à cette classe un attribut `$repository`.

3. Créez un `constructeur` qui prend en paramètre un objet de type `RepositoryManager` et initialise l'attribut `$this->repository` en allant chercher le repository correspondant à l'entité `Publication` dans le `repositoryManager`.

4. Ajoutez à cette classe une méthode `getAllPublications` qui renvoie toutes les publications.

5. Ajoutez à cette classe une méthode `createNewPublication` qui créé un ouvel objet `Publication` puis le sauvegarde dans la base de données.

6. Dans la classe `TheFeed`, enregistrez ce nouveau service sous le nom `publication_service`. Pensez à lui injecter la dépendance dont il a besoin!
</div>

### Mise à jour du controller

<div class="exercise">

1. Dans `PublicationController`, effacez le code qui accède au `repository manager`

2. Maintenant, récupérez plutôt le service `publication_service` et utilisez-le pour réaliser les deux actions définies dans le controller.

3. Testez que vos deux actions fonctionnent toujours bien.

</div>

## Une extension pour twig

Jusqu'ici tout fonctionne à merveille, mais vous allez vite découvrir un problème assez contraignant lorsque nous allons ajouter de nouvelles routes!

<div class="exercise">

1. Dans votre controller `PublicationController`, ajoutez une action `demoProbleme` qui fait exactement la même chose que l'action `feed`.

2. Enregistrez une route ayant pour chemin `/feed/demo/probleme` et visant l'action que vous venez de créer.

3. Testez d'accèder à cette route sur votre site web. Que se passe-t-il? Essayez de lire le code source de la page (`CTRL+U`) pour comprendre.

4. De même, essayez de soumettre un `feedy` sur cette page. Que se passe-t-il? il s'agit du même problème.

</div>

En fait, quand nous avons migré les templates `base.html.twig` et `feed.html.twig`, nous avons indiqué le chemin `./assets/...` pour que le navigateur puisse trouver le fichier css et les images. Ce chemin se base sur l'URL du navigateur.  
En effet, comme la page principale est accédée par le chemin `/`, on se situe dans le dossier `web`. Le chemin `./assets/` est donc trouvé par le navigateur. Cependant, quand on se trouve dans le chemin `/feed/demo/probleme`, le navigateur cherche les ressources dans un dossier `web/feed/demo/probleme/assets` qui n'existe pas!

Le chemin des `assets` ne peut donc pas être accédé de manière **relative** car ce chemin dépendrait alors de la `route` où nous nous trouvons. et il n'est pas possible de se fixer une règle "un template par route" car le template `base.html.twig` est utilisé par tous nos templates!

De même, pous l'URL de forumaire dans `feed.html.twig` et du lien dans `base.html.twig` , nous avons indiqué `/feedy` et `/`. Il s'agit du même problème ici, le navigateur va essayer de déclencher une action sur la route `/feed/demo/probleme/feedy` qui n'existe pas...!

Pour les assets, l'idée serait donc plutôt de récupérer **l'URL de base**, c'est-à-dire celle désignant le point d'entrée (le dossier `/web`).  
Mais comment faire? Nous pourrions la passer à twig à chaque rendu, mais cela semble être du bricolage plutôt qu'une réelle solution... De même, comment faire pour le problème des routes?

Heureusement, comem nous l'avons évoqué dans le `TD2`, il est possible de créer des **extensions de Twig** pour ajouter des fonctions et des filtres utilisables dans les templates. Combiné avec les services utilisés dans notre framework, nous allons donc créer une extension ajoutant des fonctions à `Twig` qui vont permettre :

   * D'obtenir l'URL des `assets` grâce à l'URL de base et aussi d'obtenir le lien d'une route.
   * De générer l'URL d'une `route` à partir de son nom (le nom enregistré quand ajouté à la collection des routes)

### Création et enregistrement de l'extension

Comme ces fonctionnalités seront fournies par notre `framework` nous allons donc créer de l'extension de ce côté-là!

<div class="exercise">

1. Dans le dossier `external/Framework` créez un répertoire `Twig` puis à l'intérieur de celui-ci un autre répertoire `Extension`. Ajoutez-y une classe `TwigAppFrameworkExtension` et donnez lui le `namespace` adéquat.

2. Faites hériter cette classe de la classe `AbstractExtension`.

3. Donnez deux attributs à cete classe : un attribut `$context` de type `RequestContext` et `$generator` de type `UrlGeneratorInterface`. Définissez ensuite le constructeur adéquat.

4. Dans la classe `TheFeed`, enresgitrez un novueau service nommé `twig_app_framework_extension` dans le conteneur. Ce service utilisera la classe cocnrète `TwigAppFrameworkExtension` et vous devrez faire en sorte que le conteneur lui injecte les services `context` et `url_generator` précédemment définis.

5. Toujours dans la même classe, vous aviez déjà enregistré le service `twig`. Maintenant, faites en sorte que le conteneur appelle la méthode `addExtension` sur ce service, avec en paramètre une **référence** vers le service `twig_app_framework_extension` que vous venez de définir. Pour rappel, on peut aussi utiliser un objet `Reference` dans les `arguments` de la méthode `addMethodCall`.

6. Vérifiez que tout fonctionne toujours bien.
</div>

La méhtode `addExtension` permet simplement d'enregistrer l'extension dans `Twig` pour qu'elle soit utilisable à travers nos `templates`.

### Une méthode pour les assets

Tout d'abord, nous allons créer une méthode qui permettra d'obtenir la bonne URL vers un `asset`. Cette méthode prendra simplement en paramètre le sous-chemin désiré à partir du dossier `assets`.

L'attribut `$context` de type `RequestContext` va nous permettre d'obtenir **l'URL de base de la requête** et donc, on pourra construire le chemin vers les `assets` à partir de cela. Cette donnée s'obtient via la méthode `getBaseUrl`.

<div class="exercise">

1. Dans la classe `TwigAppFrameworkExtension`, créez une méthode `asset` qui prend un paramètre `$path` et retourne une chaîne de caractère correspondant à la concaténation de **l'URL de base**, `/assets/` et le sous-chemin `$path` passé en paramètre.

2. Pour que cette fonction soit utilisable dans les templates `Twig`, il faut l'enregistrer d'une certaine manière. Pour cela, il faut implémenter dans la classe la méthode `getFunctions`. Cette fonction doit retourner un `tableau` composée d'objets de type `TwigFunction`. Un tel objet se compose ainsi :

   ```php
   new TwigFunction("nomFonctionDansLesTemplates", [$this, "nomFonctionDansLaClasse"]);
   ```
   La partie `nomFonctionDansLesTemplates` représente le nom qui sera utilisé dans les `templates` pour utiliser cette fonction. La partie `nomFonctionDansLaClasse` correspond au nom de la fonction de la classe qu'on veut enregistrer.

   Donc, par exemple, si on a développé une fonction `test` dans l'extension, on pourrait l'enregistrer ainsi :

   ```php
   public function getFunctions()
   {
      return [
         new TwigFunction('test', [$this, 'test']),
      ];
   }
   ```

   Elle serait alors accessible sous le nom `test` dans les templates.

   Enregistrez donc la méthode `asset` de la même manière (en utilisant le nom `asset` aussi, pour les `templates`).

</div>

### Une méthode pour obtenir le lien d'une route

L'attribut `$generator` de tpye `URLGenerator` permet de générer l'URL d'une route à partir de son nom. Pour cela, on utilise simplement la méthode `generate($routeName, $arguments)` qui renvoie l'URL désirée. Le premier paramètre correspond au nom de la route, le second aux arguments éventuels à donner (si la route contient des zones paramétrables, comme nous l'avons déjà vu.)

<div class="exercise">

1. Toujours dans la classe `TwigAppFrameworkExtension`, créez une méthode `route` qui prend deux paramètres : `$routeName` et `$arguments`. Donnez à ce second paramètre un tableau vide comme valeur par défaut. Cette méthode doit renvoyer l'URL qui correspond à la route (et aux arguments) passés en paramètre.

2. Enregistrez cette méthode sous le nom `route` dans la méthode `getFunctions`.

</div>

### Application aux templates

Les deux méthodes qui vont nous permettre de régler les soucis d'accès aux ressources et aux routes sont maintenant disponnibles dans nos `templates`! Nous allons les appliquer.

<div class="exercise">

1. Modifiez le template `base.html.twig` pour que celui-ci charge le fichier `styles.css` en utilisant la méthode `asset`. Pour rappel, il faut préciser le sous chemin à utiliser comme si on se trouvait déjà dans le dossier `assets`. Second rappel, pour utiliser une fonction dans un template :

   ```php
   {% raw %}
   {{ fonction(parametres) }}

   //Donc ici : 
   {{ asset("...") }}
   {% endraw %}
   ```

2. Toujours dans le template `base.html.twig`, utilisez la fonction `route` au lieu du le lien menant vers `/` dans le hearder. On souhaite que ce lien dirige vers la page d'accueil, donc la route menant au feed (allez voir quel nom vous avez donné à cette route quand vous l'avez enregistré...)

3. Dans le template `feed.html.twig`, utilisez la fonction `assets` pour obtenir l'image `anonyme.jpg` dans les **feedies**.

4. Toujours dans le template `feed.html.twig`, utilisez la fonction `route` dans le formulaire de création d'un nouveau **feedy** en utilisant le nom de route adéquat.

5. Chargez les pages qui correspondent aux routes `/`, `/feed/demo/probleme` et tentez aussi de publier un nouveau **feedy** et de retourner à l'accueil en cliquant sur **"The Feed"**. Vérifiez que tout marche bien (chargement des images, du fichier css, les routes, ...)

6. Supprimez la route `/feed/demo/probleme` et l'action `demoProbleme` dans `PublicationController`.
</div>

## Configuration

Notre framework et notre application sont maintenant fonctionnels! Néanmoins, si nous souhaitons modifier ou ajouter de nouvelles choses, il faut modifier et rajouter de nouvelles lignes de code dans le fichier `TheFeed`, ce qui n'est pas très otpimisé. Un meilleur moyen serait d'avoir un `fichier de configuration` que notre framework et notre application vont lire pour se construire.

Aussi, à ce stade, si nous devions construire une nouvelle application, on devrait recopier une grosse partie du contenu de la classe `TheFeed`...Certaines des opérations réalisées dans ce fichier pourraient être généralisées et déléguées au `framework`!

### Fichier de configuration

Tout d'abord, identifions ce que nous allons pouvoir paramétrer de manière générale :

   * L'emplacement du dossier source du projet (utile pour obtenir le dossier des vues)
   * Les controllers
   * Les routes
   * Les repositories
   * Les infos utiles pour utiliser la source de données

On se propose donc de définir un fichier à l'allure suivante :

```php
class ConfigurationGlobal
{
    //Les "..." correspondent au chemin relatif vers les sources de l'application
    const appRoot = __DIR__ . '...';

    const views = "...";

    const repositoryManager = [
        "manager" => MyRepositoryManager::class,
        "dataSourceParameters" => [
            'hostname' => '',
            'database' => '',
            'login' => '',
            'password' => ''
        ]
    ];

    const repositories = [
        Entity::class => EntityRepository::class,
    ];

    const controllers = [
        "controller_service_name" => MyController::class,
    ];

    const routes = [
        "routeName" => [
            "path" => "...",
            "controller" => "controller_service_name",
            "function" => "...",
            "methods" => ["...", "..."]
        ],
    ];
}
```

Quelques commentaires :

   * La partie `appRoot` correspond au chemin vers les sources de l'application (dans notre cas, le dossier `src`). Le `__DIR__` correspond à l'emplacement du fichier, il suffit donc d'iniquer, en deuxième partie, comment accèder relativement au dossier désiré.

   * La partie `views` correspond au sous-chemin du dossier contenant les vues (templates twig) à partir du chemin désigné par `appRoot`. Donc par exemple, si `appRoot` désignait un dossier `../monAppli` et que les vues se trouvent dans `monAppli/vues` on mettrait simplement `vues` pour ce paramètre.

   * La partie `repositoryManager` correspond aux informations utiles pour le manager de repositories utilisé, à savoir :

      * La classe concrète du manager utilisé

      * La partie `dataSourceParameters` qui correspond aux paramètres utiles pour initialiser la source de données. Ici, on a les paramètres pour une abse de données, mais on pourrait en préciser d'autres (cela dépendra du `repository manager` utilisé).

   * La partie `repositories` correspond au listing des différents `repositories` de l'application en faisant l'association entre la classe d'une entité et la classe du repository qui la gère.

   * La partie `controllers` correspond au listing des controlelrs en associant le nom de service du controller au  à la classe correspondante.

   * Enfin, la partie `routes` listes toutes les routes en associant le nom de la route à :

      * `path` : Le chemin de la route.

      * `controller` : Le nom de service du controller à appeller.

      * `function` : Le nom de la méthode à appeller dans le controller.

      * `methods` : La liste des méthodes HTTP autorisées quand on utilise cette route (GET, POST, ...)

   * On notera qu'on précise directement les classes en faisant `MaClasse::class` pour les reposiotries, les entités, les controllers, etc...

<div class="exercise">

1. A la racine du projet, créez un dossier `config`.

2. Dans le fichier `composer.json`, rajoutez une règle d'autoloading en faisant correspondre le **namespace** `Config\\"` avec le répertoire `config`. Mettez à jour votre projet avec :

```bash
composer update
```

3. Dans le dossier `config`, créez une classe `ConfigurationGlobal`, donnez -lui le `namespace` **Config** et copiez le contenu du fichier de configuration que nous venons d'introduire.

4. Modifiez le contenu de ce fichier pour enregistrer toutes les informations de votre application :

   * Le `appRoot`, c'est à dire l'emplacement du dossier `src` par rapport à ce fichier.

   * Le `views`, c'est à dire l'emplacement du dossier `View` à partir du dossier `src` (c'est assez facile...!)

    * La classe du `repository manager` utilisé (dans notre cas `RepositoryManagerMySQL`) et les informations pour se connecter à votre base de données.

   * Les différentes associations entre entités et repositories (pour l'instant, une seule, entre `Publication` et `PublicationRepository`...)

   * Les différents `controllers` (pour l'instant, seulement `publication_controller` associé à `PublicationController`...).

   * Les différentes `routes` avec les paramètres nécessaires (il y a deux routes..!)

</div>

### Généralisation des enregistrements dans le conteneur de services

Maintenant que votre fichier de configuration est prêt, nous allons pouvoir réduire le code de la méthode `initializeApplication`!

<div class="exercise">

1. En utilisant une boucle `foreach`, enregsitrez vos `routes` en allant chercher l'information dans le fichier `ConfigurationGlobal`. Pour rappel, on peut accèder aux constantes de ce fichier en utilisant `ConfigurationGlobal::constante`. Aussi, il existe une écriture du `foreach` qui vous permet d'accèder à la fois à une clé du tableau et sa valeur associée à chaque itération.

2. Faites la même chose pour l'initilisation des `controllers`.

3. Toujours en vous aidant de `ConfigurationGlobal`, intialisez le service `repository_manager`. Pour l'ajout des différents repositories, vous devriez être capable de faire cela en utilisant une seule fois `addMethodCall` en utilisant une méthode de `RepositoryManager` qui permet d'ajouter les repositories à partir d'un tableau!

4. En combinant les paramètres `appRoot` et `views` de `ConfigurationGlobal`, construisez un chemin vers le dossier contenant les vues . Utilisez ce chemin comme paramètre d'intialisation du `twig loader`.

5. bien entendu, supprimez toutes les anciennes formes d'intialisation des routes, controlelrs, etc...qui n'utilisent pas le fichier de configuration!

6. testez votre application et vérifiez que tout fonctionne bien.

</div>

### Initialisation du framework

Vous l'aurez remarqué, maintenant que nous utilisons un fichier de configuration contenant tous les paramètres relatifs à notre application, beaucoup des lignes de code contenu dans la classe `TheFeed` sont généralisées et ne dépendent pas de notre application...Nous pouvons donc globaliser tout cela en déléguant une partie de ces tâches au `framework`!  
En fait, nous allons pouvoir presque tout globaliser, à part la déclaration des services que nous n'avons pas pu mettre dans notre fichier de configuration (pour le moment...)

<div class="exercise">

1. Dans le dossier `external/Framework`, créez une classe `AppInitializer` et donnez lui le `namespace` adéquat.

2. Ajoutez une méthode `initializeApplication` qui reprend quasiment tout le code de la même méthode dans la classe `TheFeed` sauf l'enregistrement du service `publication_service`. Cette méthode doit toujours retourner le conteneur de services.

3. Faites hériter la classe `TheFeed` de `AppInitializer` et supprimez tout le code de la méthode `initializeApplication` sauf l'enregistrement du service `publication_service`. Vous pouvez devez récupérer (et donc initialiser) le conteneur en appelant la méthode parente afin de pouvoir enregistrer le service des publications (rappel : `parent::methode()`). N'oubliez pas de retourner le conteneur également.

4. Vérifiez que tout fonctionne.

</div>

Bien! Notre application a moins de choses à gérer, le gros du travail est fait par notre framework, ce qui est une bonne chose, car nous pourrons le réutiliser pour d'autres projets...!  
Mais notre framework est-il vraiment indépendant en l'état...? Non! car il **dépend** (il importe) la **classe de configuration** de notre application! Nous allons corriger cela en la rendant paramétrable.

<div class="exercise">

1. Modifiez la méthode `initializeApplication` de `AppInitializer` pour qu'elle accueille un paramètre `$configurationClass`. Modifiez également la signature de la méthode dans `TheFeed` en conséquence (et l'appel à la méthode parente).

2. Utilisez ce paramètre à la place de `ConfigurationGlobal`. Il su'itlise de la même manière, car il représentera une classe (donc, à la place de `ConfigurationGlobal::constante`, vous obtenez `$configurationClass::constante`).

3. Dans `app.php`, il faut modifier l'appel à `initializeApplication` en donant en paramètre la classe `ConfigurationGlobal::class`.

4. Vérifiez que tout fonctionne.
</div>

### Gérer l'enregistrement des services avec le fichier de configuration

Bon...est-ce qu'il n'y aurait pas aussi un moyen d'enregistrer les services dans le fichier de configuration? Bien sûr. Il y a plusieurs soutions plus ou moins élégantes pour cela, mais certaines demandent pas mal de code supplémentaires (si les services font références à d'autres services, etc...). Nous allons donc utiliser une solution intermédiaire qui pourrait être nettement améliorée dans le futur.

<div class="exercise">

1. Dans la classe `ConfigurationGlobal`, créez une méthode `static` (méthode "de classe") nommée `services` et prenant un paramètre `$container` (le conteneur de services).

2. Déplacez le code qui enregsitre le service `publication_service` dans cette méthode.

3. Dans la méthode `initializeApplication` de `AppInitializer`, ajoutez une ligne qui appelle la méthode `services` sur la classe de configuration (qui, on le rappelle est une variable de la méthode).

4. Enfin, supprimez la méthode `initializeApplication` de `TheFeed`...Il n'y en a plus besoin (présentement) vu que le framework se charge de tout! Comme la méthode n'est plus redéfinie dans cette classe, l'appel dans `app.php` utilisera automatiquement la méthode parente. Nous garderons néamoins cette classe qui peut être utile si nous souhaitons réaliser des opérations avant l'initialisation par le `framework`.

5. Comme toujours, vérifiez que tout fonctionne comme il faut.

</div>

## Une application multi-environnements

Il est courant pour un framework de proposer plusieurs `environements`, c'est à dire pouvoir gérer plusieurs `configurations` de l'application. L'intérêt est de pouvoir par exemple avoir un environnement de `production` configuré avec les paramètres réels, tels qu'utilisé dans l'application finale (base de données, etc...) et un environnement de `développement` avec une autre base de données, éventuellements des paramètres de test (faux serveur mail, etc...). Généralement, lorsqu'on code l'application, on se sert de l'environnement de `développement` et celui de `production` sert seulement lors de la mise en ligne. On peut aussi utiliser un autre environnement pour les `tests unitaires`.

Nous allons voir dans cette partie comment intégrer facilement la gestion de plusieurs environnements. En fait, depuis le dernier exercice, comme nous avons rendu la configuration paramétrable pour notre `framework`, il en est déjà capable!

Qui dit plusieurs environnements dit aussi plusieurs `points d'entrées` (un point d'entrée par environnement).

### Plusieurs configurations

Nous allons commencer par créer plusieurs dossiers (un peu chaque environnement) et un fichier de cofniguration dédié. L'idée est que `ConfigurationGlobale` donne la configuration "par défaut" et que les sous-fichiers de configuration de chaque environnement viennent modifier seulement ce dont ils ont besoin.

<div class="exercise">

1. Dans le dossier `config` créez un dossier `Environment` puis, à l'intérieur de ce nouveau dossier, un dossier `Production`.

2. Dans le dossier `Production`, créez une classe `ConfigurationProduction` qui hérite de `ConfigurationGlobal`. donnez-lui le namespace adéquat.

3. Déplacez la constante `repositoryManager` de `ConfigurationGlobal` dans ce fichier `ConfigurationProduction` (le repository et la source de données dépendra de la configuration...)

4. Dans `app.php`, mettez à jour la configuration utilisée pour préciser `ConfigurationProduction`. Vérifiez que tout marche bien.

</div>

<div class="exercise">

1. Dans le dossier `Environment` créez un dossier `Development`.

2. Dans le dossier `Development`, créez une classe `ConfigurationDevelopment` qui hérite de `ConfigurationGlobal`. donnez-lui le namespace adéquat.

3. Téléchargez la classe [RepositoryManagerSQLite]({{site.baseurl}}/assets/TD3/RepositoryManagerSQLite.php) et une fichier de base de donnees [database_development]({{site.baseurl}}/assets/TD3/database_development). Cela correspond à un manager qui permet de gérer des bases de données `SQLite` (stockées dans un fichier) et le fichier correspondant à la strucutre de ntore base.

4. Placez le fichier `RepositoryManagerSQLite` dans `external/Framework/Storage/SQL` et le fichier `database_development` dans le dossier `Development`.

5. Redéfinissez la constante `repositoryManager` pour préciser votre base de données `sqlite`

   * Le manager : la classe `RepositoryManagerSQLite`

   * Les paramètres : simplement `file` qui pointe sur la base de données : `__DIR__."/database_development"`

6. Dans le dossier `web` créez un fichier `app_dev.php`. Copiez-y le contenu de `app.php` mais changez la classe de configuration utilisée pour `ConfigurationDevelopment`.

7. Accèdez à l'adresse suivante (en changeant avec votre login dans la route, bien sûr) : [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD3/app_dev.php](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD3/app_dev.php).

</div>

Cela à l'air de fonctionner...mais encore une fois le css et les images ne sont pas chargés! Sauriez-vous dire pourquoi?

En fait, maintenant que nous chargeons la page à partir de `/app_dev.php` et pas `/` (souvenez-vous, nous avons créé le `.htaccess` pour ne pas avoir le `/app.php` dans la barre de recherche), le dossier `assets` est situé un cran plus haut...Il faudrait donc adapter la fonction `assets` de l'extension `twig` pour prendre en compte le fait que nous sommes dans un autre envrionnement.

### Les paramètres du conteneur de services

En plus des `services`, le conteneur peut aussi contenir des `paramètres` (string, booléens, entiers...) qui sont aussi injectables. Pour cela, on utilise la méthode suivante :

```php
$container->setParameter($paramterName, $value);

//Par exemple
$container->setParameter("test_param", 5);
```

Ensuite, pour l'injecter dans un autre service, on utilise simplment leur nom avec comme préfixe et comme suffixe  les marqueurs `%` :

```php
$containerBuilder->register('exemple_service', ExempleService::class)
   ->setArguments([
      new Reference('un_autre_service'),
      "%test_param%"
   ])
;
```

Nous allons adapter nos `configurations` et ntore extension `Twig` pour prendre en compte l'environnement à travers un paramètre booléen `debug`.

<div class="exercise">

1. Dans vos nos fichiers de configurations (production et développement) ajotuez un paramètre `debug`. Celui-ci est à `false` pour l'environnement de production et à `true` pour celui de développement.

2. Dans votre extension `TwigAppFrameworkExtension` ajoutez un attribut `debug` et ajotuez le dans le constructeur.

3. Dans `AppInitializer`, faites en sorte d'enregistrer le paramètre `debug` puis de l'injecter dans le service `twig_app_framework_extension`.

4. Dans la classe `TwigAppFrameworkExtension`, modifiez la méthode `assets` pour que :

   * Si `debug` vaut `true`, renvoyer une URL qui remonte un cran au dessus (`../`) dans la construction du chemin, après **l'URL de base** et avant le dossier `assets`.

   * Sinon, renvoyer la même URL qu'auparavant.

5. Testez de charger votre environnement de développement via `app_dev.php`, tout devrait fonctionner maintenant! vérifiez aussi que rien n'est cassé du côté de l'environnement de production (donc l'environnement normal accessible sans rien préciser).

</div>

### Sécurisation de l'environnement de développement

Très bien, notre environnement de développement est fonctionnel...Mais à ce stade, tout le monde peut s'y connecter (essayez avec vos collègues s'ils en sont là...) et ce n'est as souhaitable! Heureusement, il est possible de filtrer les IPs qui se connectent à un environnement via son point d'entrée. Nous allons donc seulement autoriser l'IP locale (`127.0.0.1`) à accèder à notre nouvel environnement.

<div class="exercise">

1. Dans `app_dev.php`, ajotuez les lignes suivantes, avant l'initialisation de `TheFeed` :

   ```php
   if (isset($_SERVER['HTTP_CLIENT_IP'])
      || isset($_SERVER['HTTP_X_FORWARDED_FOR'])
      || !(in_array(@$_SERVER['REMOTE_ADDR'], ['127.0.0.1','::1'], true) || PHP_SAPI === 'cli-server')
   ) {
      header('HTTP/1.0 403 Forbidden');
      exit('You are not allowed to access this file. Check '.basename(__FILE__).' for more information.');
   }
   ```

2. Prenez le temps de comprendre ces lignes. Vérifiez que vous pouvez toujours accèder à cet environnement depuis votre ordinateur.

3. Sur l'ordinateur d'un collègue (ou via votre smartphone), essayez maintenant d'accèder à votre environnement de développment. L'accès devrait être refusé.

</div>

## Conclusion

Nous avons enfin notre framework complet! Bien sûr, il a encore des défauts et beaucoup de choses pourraient être améliorées et étendues, mais il est fonctionnel et réutilisable!

Dans le prochain TD, nous allons donc l'exploiter pour optimiser le développement de notre application : `The Feed`!

<!--
## Gestion des événements

### Evenement pour la gestion d'erreurs

### Listener pour customiser les pages d'erreurs

### Modification du framework

### Templates twig pour les erreurs de l'application
-->


