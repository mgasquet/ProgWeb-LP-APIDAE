---
title: TD5 &ndash; Compléments &ndash; Securité, Customisation & API
subtitle: Securite, Evenements, API, REST
layout: tutorial
lang: fr
---

## Démarrage

Pour sauvegarder votre progression TD par TD, il est conseillé de recréer un nouveau dossier pour chaque TD et d'y copier le contenu réalisé lors du précédent TD.

A l'aide de PHPStorm créez dond un nouveau projet vide dans le dossier `public_html/TD5` 
de votre répertoire personnel. 
Pour ceci, sélectionnez `New Project`, `PHP Empty Project`, Location: `/home/licence/votre_login/public_html/TD5`.

Copiez le contenu de votre dossier `TD4` dans `TD5`.

Vérifiez que l'URL suivante donne bien accès à votre site : 

[http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD5/web/](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD5/web/).

Attention, dorénavant, il faudra bien vérifier que `TD5` est dans l'URL!

## Sécurité

Comme nous l'avons évoqué dans le TD précédent, toutes les routes de notre site sont accessibles, peut importe que l'on soit connecté ou non. Cela pose certains problèmes de logique : par exemple, est-il normal de pouvoir accèder à la page de connexion ou d'inscription quand on est connecté ? Est-il normal de pouvoir accéder à la route de déconnexion quand on n'est pas connecté?

Aussi, par exemple, même si on a fait disparître le formulaire d'envoi des publications pour un utilisateur non connecté, la route est toujours accessible (par exemple, via un terminal et `telnet`, ou une application comme `Postman`...).

Il serait donc bien que l'on puisse paramètrer une route de manière à ce que des vérifications soit faites, avec deux "modes" :

- `logged` : L'utilisateur doit être authentifié. si l'utilisateur n'est pas connecté, redirige vers la page de connexion.
- `force_not_logged` : L'utilisateur ne doit pas être déjà authentifié. Si l'utilisateur est connecté, on redirige vers la page d'accueil (vers le feed).

On pourrait ajouter du code pour vérifier cela et faire les bonnes redirections dans les actions en relation avec ce comportement dans les controllers, mais cela dupliquerait pas mal de code...! Non, à la place, nous allons plutôt utiliser le **système d'événements** que nous avons abordé dans le TD4.

La logique sera alors la suivante :

1. Ajouter des options aux routes, sous le nom `logged` et `force_not_logged`, pour représenter nos deux modes.

2. Dispatcher un événement quand on a trouvé la route correspondant à la requête, au niveau du `framework`.

3. Attrapper cet événement du côté de l'application (avec un **listener**) et vérifier si elle comporte un des deux modes. Si c'est le cas, via le `service des utilisateurs`, vérifier l'état de l'utilisateur (connecté ou non) et, si le mode n'est pas respecté, effectuer une redirection (vers la page de connexion pour `logged` et vers le feed pour `force_not_logged`).

Ainsi, le code de ce comportement sera géré à un seul endroit et nous pourrons facilement configurer l'accès des routes au niveau du fichier de configuration.

### Evenement lors de l'accès à un route

<div class="exercise">

1. Dans `exeternal/Framework/Event` créez une nouvelle classe `RouteAccessEvent`. Celle-ci devra contenir un attribut `$routeData` (de type `array`) initialisé par le constructeur (représentant les données de la route) ainsi qu'un getter pour cet attribut. N'oubliez pas de définir son `namespace` et de la faire hériter de `Event`!

2. Dans votre classe `AppFramework`, vous devriez avoir un bout de code semblable à celui-ci :

    ```php
    $this->urlMatcher->match($request->getPathInfo());
    ```

    Ce code permet d'obtenir toutes les informations sur la route auquel l'utilisateur accèder, à partir du chemin de la requête. Si on stocke ce résultat dans une variable, on peut accèder à différents paramètres stockés dans la route :

    ```php
    $routeData = $this->urlMatcher->match($request->getPathInfo());
    $routeName = $routeData['_parametre'];
    ```

    Faites un `var_dump` de cette variable pour visualiser son contenu (et après supprimez-le) puis, dans la méthode `handle`, utilisez donc le `dispatcher` pour diffuser un événement `RouteAccessEvent` contenant les données de la route auquel l'utilisateur accède. Cet événement devra être diffusé sous le nom `onRouteAccess`.
    
3. Dans `src`, créez un nouveau dossier `Listener`, puis, à l'intérieur, une classe `AppListener` avec le bon `namespace`. Cette classe doit pouvoir **gérer des événements**. Allez voir la classe `FrameworkListener` si vous ne vous souvenez plus comment faire. Cette classe doit posséder un attribut `$utilisateurService` de type `UtilisateurService` (pour vérifier si l'utilisateur est connecté ou non).

4. Enregistrez ce listener comme **service** nomme `app_listener` dans votre fichier de configuration en lui injectant la bonne dépendance.

5. Il y a un petit soucis : comment enregsitrer notre service comme `subscriber` auprès du dispatcher d'événements? Pour celui du Framework, c'était facile, nous l'avons directement enresgitré dans `AppInitializer`, vu qu'il est relatif au framework. Mais ici, comme `AppListener` est relatif à l'application, cela n'est pas possible (le code du framework doit pouvoir être réutilisé tel quel pour une autre application...). il faut donc appliquer la même solution que nous avons mis en place pour enregsitrer les routes ou les controllers, par exemple. 

En ajoutant une nouvelle constante `listeners` dans votre fichier `ConfigurationGlobal` et en adaptant `AppInitializer`, faites en sorte de pouvoir enregsitrer une liste de `services` comme `subscriber` auprès du dispatcher d'événements.

6. Avec votre nouvelle configuration, enregsitrez `app_listener` comme `subscriber` du dispatcher, depuis `ConfigurationGlobal`.

7. Dans `AppListener`, créez une méthode `checkRoute` prenant un paramètre de type `RouteAccessEvent`. Faites en sorte que la classe gère l'événement nommé `onRouteAccess` en utilisant cette méthode. Pour voir si cela fonctionne, faites un "`echo Coucou`" temporaire dans cette méthode (puis chargez n'improte quelle page).

8. Nous pouvons déjà ajouter les options `logged` et `for_not_logged` sur les routes dans `ConfigurationGlobal` sous la forme de `booléens` :

    ```php
    const routes = [
        "exemple" => [
            "path" => "/exemple",
            "methods" => ["..."],
            "parameters" => [
                "_controller" => "my_controller::feed",
                "logged" => true
            ]
        ],
        ...
    ]
    ```

    Configurez vos routes suivantes de la manière suivante :

    * Envoi d'une nouvelle publication : doit être connecté

    * Deconnexion : doit être connecté

    * Inscription (accès à la page et action) : doit être déconnecté

    * Connexion (accès à la page et action) : doit être déconnecté

9. Dans `checkRoute`, en utilisant l'événement, affichez temporairement les données de la route (avec un `var_dump`). Tentez d'accéder à une route que vous avez configuré dans la question précédente et vérifiez que la paramètre `logged` ou `force_not_logged` est bien présent.

10. Pour l'instant, nous allons simplement émetrre des `exceptions` qui seront gérées par le Framework si l'accès à une route n'est pas autorisé. Créez donc un dossier `Exception` dans `external/Framework` et ajoutez-y deux nouvelles classes d'exception nommées `UserNotLoggedException` et `UserAlreadyLoggedException`. Choissisez le bon `namespace` et n'oubliez pas l'héritage!

11. Dans la méthode `checkRoute`, faites en sorte que l'exception `UserNotLoggedException` soit levée si le paramètre `_logged` est présent dans les données de la route et vaut `true` et que l'utilisateur n'est pas connecté. Faites quelquechose de similaire avec l'exception `UserAlreadyLoggedException` pour `_force_not_logged` si l'utilisateur est connecté. Il faudra notamment vous servir de la fonction `array_key_exists` (pour vérifier l'existence d'une clé dans un tableau) et aussi du `service` injecté dans `AppListener`.

12. Au niveau du `Framework`, on veut que ces exceptions soit gérées en renvoyant des codes de réponse HTTP particuliers. En l'occurence, `401` (Unauthorized) pour `UserNotLoggedException` et `403` (Forbidden) pour `UserAlreadyLoggedException`. Dans la méthode `handle` de `AppFramework`, faites en sorte d'obtenir ce comprotement (anlysez ce qui est déjà fait avec les deux exceptions déjà gérées...).

13. Connectez vous et tentez d'accèder à la page de connexion (directement via l'URL) et observez que cela vous renvoie bien un code d'erreur!

</div>

### Un peu de customisation

Bien, nos routes sont sécurisées, mais nous n'avons toujours pas le résultat souhaité, à savoir : rediriger vers la page de connexion ou le feed, selon la situation.

Pour remédier à cela, nous allons émettre et prendre en charge de nouveaux événements. Dès que le framework souhaitera retourner une réponse avec un code d'erreur HTTP, il lévera un événement. Le(s) (plutôt le, dans le contexte) listener(s) qui gère cet évenement devra alors analyser le code d'erreur et construire une réponse adéquate en conséquence. Le framework récupérera alors cette réponse et la retournera.

<div class="exercise">

1. Créez une nouvelle classe d'événement `ErrorResponseHandlingEvent` au niveau du framework. Vous devirez savoir où la placer et comment la configurer. Cettte classe doit contenir **trois attributs** :

    * `$status` : Un eniter qui correspond au code de réponse HTTP (401, 404, 500, etc...)

    * `$exception` : Une exception (`Exception`). Eventuellement celle qui a déclenché l'erreur.

    * `$response` : La réponse (`Response`) à fournir au Framework.

2. Définissez le constructeur de cette classe. Elle ne prendra que deux paramètres : `$status` et `$exception` qui aura la valeur `null` par défaut (on n'est pas obligé de préciser l'exception quand on créé l'événement...). Concernant `$response` cet attribut sera directement intialisé dans le constructeur ainsi :

    ```php
    $this->response = new Response("Erreur $this->status", $this->status);
    ```

    En fait, il s'agit d'une **réponse par défaut** à donner au framework si aucun listener n'a **modifié** cette réponse entre temps (ce que nous allons faire par la suite) pour pas qu'il y ai d'erreur et qu'une réponse soit obligatoirement retournée, quoi qu'il arrive, peu importe si l'papliation a géré cet événement ou non.

3. Définissez des `getters` pour tous les attributs et aussi un `setter` pour `response`. En effet, comme nous l'avons souligné, la réponse a pour but d'être modifiée par un listener gérant l'événement puis d'être récupérée par le framework, à travers l'événement. En fait, `ErrorResponseHandlingEvent` est un peu une sorte de "tube" de communication entre le framework et l'application. Chacun y dépose / lit un message. En l'occurence ici : le framework dépose un code d'erreur, l'application dépose une réponse.

4. Dans `Appframework` au niveau de la méthode `handle`, modifiez le traitement de **chaque exception** pour :

    * Créer un événement `ErrorResponseHandlingEvent` avec le code d'erreur HTTP et l'exception.

    * Dispatcher l'événement sous le nom `onErrorResponseHandling`.

    * Récupérer **la réponse** depuis l'événement.

5. Dans `AppListener`, créez une nouvelle méthode `updateErrorResponse` prenant en paramètre un événement `ErrorResponseHandlingEvent`. Faites en sorte que l'événement `onErrorResponseHandling` soir géré par cette classe en utilisant cette nouvelle méthode.

6. Pour pouvoir `rediriger` vers une autre route, il nous faudra utiliser un generateur d'url (donc de type `UrlGeneratorInterface`)...cela tombe bien, notre framework a déjà enregistré un tel service! Vous l'utilisez notamment dans la classe `Controller`! Ce service porte le nom de `url_generator`. Faites donc en sorte de disposer de ce service dans `AppListener` en l'injectant depuis votre configuration.

7. Dans `updateErrorResponse`, faites en sorte de :

    * Si le code contenu dans l'événement est **401** : modifier la réponse de l'événement avec une réponse de redirection (`RedirectResponse`) menant vers la route de la **page de connexion**.

    * Si le code contenu dans l'événement est **403** : modifier la réponse de l'événement avec une réponse de redirection (`RedirectResponse`) menant vers la route du **feed**.

    Vous deverez utiliser les `noms de routes` (et pas leur chemin).

8. Retestez d'accèder, par exemple, à la page de connexion une fois connecté et/ou ouvrez deux pages d'accueil, déconnectez-vous sur une puis tentez d'envoyer un novueau **feedy** sur l'autre. Vous devriez être maintenant redirigé correctement!

</div>

Nous avons enfin le comportement que nous désirions et donc, une méthode simple pour gérer la sécurité de nos routes. Maintenant, il serait aussi intéressant de gérer les autres **erreurs** (page non trouvée ou erreur générale) avec des pages customisées.

<div class="exercise">

1. Dans `View`, créez un nouveau dossier `Erreurs` et placez-y un template nommé `notFound.html.twig` avec le contenu suivant :

    ```twig
    {% raw %}
    {% extends "base.html.twig" %}

    {% block page_title %}Ressource introuvable!{% endblock %}

    {% block page_content %}
    <div id="error-block-container" class="center">
        <div class="error-block center">
            <p>Page introuvable!</p>
        </div>
    </div>
    {% endblock %}
    {% endraw %}
    ```

    Assurez-vous de bien comprendre ce template.

2. Dans `AppListener`, nous allons devoir générer une page à l'aide twig pour l'erreur **404**. Quel service faut-il injecter pour réaliser cette opération? Faites les modifications nécessaires.

3. Au niveau de la méthode `updateErrorResponse`, en cas de code **404**, faites en sorte de modifier la réponse de l'événement avec une nouvelle réponse (`Response`) contenant la page générée par le template `notFound.html.twig`. On devra bien préciser le code **404** lors de la création de l'objet `Response` (deuxième paramètre).

4. Testez d'accéder à une route qui n'existe pas...Votre nouvelle page devrait s'afficher!

5. Ajoutez ce nouveau template nommé `error.html.twig` dans `Erreurs` :

    ```twig
    {% raw %}
    {% extends "base.html.twig" %}

    {% block page_title %}Erreur!{% endblock %}

    {% block page_content %}
    <div id="error-block-container" class="center">
        <div class="error-block center">
            <p>Une erreur est survenue !</p>
            <p>{{ message }}</p>
        </div>
    </div>
    {% endblock %}
    {% endraw %}
    ```

    Vous l'aurez remarqué, contrairement au précédent template, celui-ci attend un paramètre `message` (message d'erreur customisé).

6. Faites en sorte que l'erreur **500** déclenche une réponse contenant cette page. Le message utilisé par le template sera celui contenu dans **l'exception** ayant déclenché cette réponse. Rappel : cet exeception est disponnible dans l'événement `ErrorResponseHandlingEvent`.

7. Déclenchez une erreur et vérifiez que la page d'erreur et le message est bien affiché. Par exemple, en ajoutant cette ligne de code dans le bloc `try` de la méthode `handle` de `AppFramework` :

    ```php
    throw new Exception("test");
    ```

8. Tentez de factoriser le code des deux `templates` d'erreurs.

</div>

Très bien, notre application se sert pleinement des services proposés par le `framework` pour customiser les pages d'erreurs. Néanmoins, pour la page d'erreur générale qui contient des messages d'erreurs provenant d'exceptions, il peut être dangereux d'exposer certaines des informations contenues dans ces messages (par exemple, une exception lors de la création d'un objet PDO peut potentiellement exposer les identifiants!).

Il faudrait donc regarder, dans le template, si on est dans un `environnement` configuré avec le mode `debug` (comme l'environnement de développement) et dans ce cas seulement, afficher le message.

<div class="exercise">

1. Dans `AppInitializer`, faites en sorte que le paramètre de configuration `debug` soit enregsitré comme variable globale de `twig` sous le nom `debug` quand il sera initialisé, en utilisant `addMethodCall`.

2. Dans le template `error.html.twig`, faites en sorte d'afficher le message d'erreur seulement si le paramètre `debug` vaut `true`. (cela se fait simplement dans un `if` et sans opérateur de comparaison...)

3. Déclenchez une erreur comme dans l'exercice précédent et vérifiez que le message n'est pas affiché dans l'environnement de `production` et qu'il est bien affiché dans l'environnement de `développement`.

</div>

### Sessions multi-environnements

Notre framework et notre application deviennent de plus en plus complets...mais il y a un autre problème auquel vous n'avez (peut-être) pas pensé!

<div class="exercise">

1. Créez un compte sur le site depuis votre environnement de production.

2. Connectez-vous avec ce nouveau compte.

3. Switchez sur votre environnement de développement.

4. Publiez une nouvelle publication...que se passe-t-il???

</div>

Comme vous l'avez sans doutes compris, le fait de changer d'environnement de permet pas de changer de session! L'application avait toujours en mémoire le fait que l'utilisateur était connecté alors qu'on se trouvait dans un autre environnement où l'utilisateur n'existait pas. C'est donc un problème auquel il faut remédier.

Pour cela, nous allons utiliser la `session` pour stocker les données relativement à l'environnement dans lequel on se trouve. Chaque environnement possèdera un identifiant (so nom) et il faudra alors créer une associant entre cet identifiant et quelque chose pour stocker un ensemble de données dans la session (par exemple, un `AttributeBag`). Puis, dans les méthodes du `SessionManager`, au lieu d'aller chercher dans la `session`, on ira chercher dans le sous-ensemble correspondant à l'environnement.

<div class="exercise">

1. Créez une constante `environment` dans `ConfigurationProduction` et `ConfigurationGlobal`. Cette constante prendra la valeur `production` dans la première configuration et `development` dans la deuxième.

2. Modifiez `SessionManager` pour qu'il accepte un paramètre `$environment` dans son constructeur. Dans `AppInitializer`, injectez cet élément dans le service `session_manager`.

3. Dans `SessionManager` changez le type de l'attribut `$session` en `AttributeBag` et renommez le en `$environmentSession` (attention, des méthodes utilisent cet attribut...Utilisez donc : clic droit -> Refactor -> Rename). Cela ne devrait pas poser de problème aux autres méthodes, car ce type d'objet possède les mêmes méthodes que nous utilisions sur la session, auaparavant.

4. Dans le `constructeur` de `SessionManager` il vous faut alors coder le comportement suivant :

    * Démarrer une session, comme auparavant

    * Si la session possède une association liée à la clé `$environement`, récupérée la valeur associée et l'affecter à `$this->environmentSession`. En fait, ici, on récupère les données (l'attribute bag) de la session liée à l'environnement (si elles existent).

    * Sinon, initialiser `$this->environmentSession` avec un nouvel `AttributeBag` puis créer une association dans la session en affectant la clé `$environement` à `$this->environmentSession`. Ici, on itniale les données de session liée à notre environnement si elels n'existent pas.

5. Retentez l'expérience de l'exercice précédent (assurez-vous de vous deconnecter de partout avant, sur chaque environnement). il ne devrait plus y avoir de problèmes, les données de session sont maintenant relatives à l'environnement!

</div>

## Création d'une API

De nos jours, les architectures qui séparent activement la partie `back-end` (serveur, routage, services, accès aux données) de la partie `front-end` (ce qui est rendu niveau client, pages html, etc...) sont de plus en plus privilégiées. En effet, une telle séparation permet notamment d'utiliser un même serveur applicatif avec plusieurs technlogies clientes (une application sur smartphone, plusieurs sites webs, etc...).

Dans ce fonctionnement, le serveur ne doit alors que renvoyer des données (généralement au format `JSON`, ou bien parfois `XML`) mais il ne se charge pas du rendu de la page. C'est alors els technlogies clientes qui, une fois les données récupérées auprès du serveur, les utilisent pour mettre à jour leur interface. On appelle alors le programme côté back-end une `API` pour `Application Programming Interface`. Cela signfie en fait que ce programme est lui-même un `service` qui sert à éxécuter des actions et récupérer de l'information, mais pas de document.

Le modèle de notre application suit un mode `server-rendering` où le serveur se charge de tout, jusqu'à la génération complète de la page et donc, de l'interface. Le client ne sert alors qu'à recevoir une page complète. Il serait donc difficile, en l'état de rajouter une application mobile qui utiliserait notre application, car celle-ci ne pourrait pas utiliser les pages HTML renvoyées par notre serveur.

Nous allons donc commencer à mettre en place une `API`. Dans notre contexte, nous nous en servirons pour `dynamiser` le site afin d'éxécuter certaines opérations sans avoir besoin de recharger la page!

Idéalement, dans le futur (dans le cours de développement mobile!) notre ne devrait plus être qu'une `API` (plus de `server-rendering`) et nous mettrions alors en place diverse technologies `front-end` pour communiquer avec.

Nous allons utiliser un `style architectural` d'API bien précis. Ce style est nommé `REST` pour **representational state transfer**. Dans cette architecture les **ressources** doivent être désignées à travers des routes formulées de manière précise, par exemple :

* `/utilisateurs` : désigne tous les utilisateurs

* `/utilisateurs` : désigne l'utilisateur 1

* `/feedy` : désigne toutes les publications

* `/feedy/3` : désigne la troisième publication

* `/utilisateurs/1/feedy` : désigne toutes les publications de l'utilisateur numéro 1

* `/utilisateurs/1/feedy/5` : désigne la 5ème publication de l'utilisateur numéro 1

Grossièrement, on retrouve le schéma `/{ensemble}/{id}/...` etc...

Pour manipuler ces ressources, on utilise les méthodes `HTTP` suivantes :

* `GET` : Récupère les données de la ressource désignée par la route.

* `POST` : Crée une ressource dans l'ensemble désignée par la route avec les informations fournies dans le corps de la requête.

* `PUT` : Remplace complétement la ressource désignée par la route avec les informations fournies dans le corps de la requête (tous les attributs doivent donc être spécifiés, comme pour `POST`).

* `PATCH` : Met à jour partiellement les données de la ressource désignée par la route avec les informations fournies dans le corps de la requête (seul les attributs qui ont besoin d'être mis à jour doivent être spécifiés).

* `DELETE` : Supprime la ressource désignée par la route.

Donc, par exemple, on pourrait avoir :

* `GET /feedy` : Renvoie toutes les publications (feedies).

* `GET /feedy/1` : Renvoie les informations du feedy ayant pour identifiant 1.

* `POST /feedy` : Créé un nouveau feedy (et renvoie ses informations).

* `DELETE /utilisateurs/3` : Supprime l'utilisateur numéro 3.

En plus de cela, une `API REST` doit être **sans état** (stateless), c'est-à-dire que le serveur **ne doit pas stocker d'informations sur l'état du client**, donc, par exemple, une session. A la place, le client peut stocker des données sous la forme de `token` qui peuvent être lus et vérifiés par le serveur.  
Dans un premier temps, notre `API` ne respectera donc pas ce principe (car notre framework utilise des `sessions`). Plus tard, quand nous reviendrons sur ce sujet pendant le cours de développement mobile, où nous donnerons la capacité à notre framework d'utiliser des `JSON Web Tokens` et donc, de respecter la partie `stateless`!

### Mise en place

Par défaut, le serveur web de l'iut bloque de manière générale les autres méthodes `HTTP` telles que `PUT`, `PATCH` et `DELETE`. Mais vous pouvez les autoriser seulement sur votre site.

<div class="exercise">

1. Ouvrez votre fichier `.htaccess` situé dans `web` et ajotuez les lignes suivantes après la ligne `DirectoryIndex` au début du fichier :

    ```html
    <Limit GET POST PUT PATCH DELETE>
        Order deny,allow
        Require all granted
    </Limit>
    ```
2. Rechargez une page de votre site web et vérifiez que tout est toujours accessible.

</div>

### Ajout de feedies 

Nous allons créer la première fonctionnalité de notre `API`! Celle d'ajouter des feedies. Nous avons déjà pratiquement tout ce qu'il faut. Il faut néamoins pouvoir convertir un objet `Publication` en données `JSON`.

Fort heureusement, cela est déjà prévu par `PHP`. Il suffit qu'une classe implémente l'interface `JsonSerializable`. Cette classe doit alors implémenter la méthode `jsonSerialize` retournant un `array` (tableau associatif) contenant les données de l'objet. Cette méthode sera appellée quand on voudra faire une réponse au format `JSON`.  
Par exemple :

```php
class Personne implements JsonSerializable {

    private $nom;

    private $prenom;

    private $age;

    public function jsonSerialize() : array {
        return [
            "nom" => $this->nom,
            "prenom" => $this->prenom,
            "age" => $this->age
        ];
    }

}
```

On peut bien sûr sélectionner les données qu'on osuhaite renvoyer. On n'est pas obligé de renvoyer tous les attributs. Globalement, on ne sérialise pas de données très sensibles, comme par exemple, le mot de passe d'un utilisateur, même chiffré! On transmet seulement ce dont le client a besoin pour focntionner.

On peut également sérialiser les données d'un attribut objet en ajoutant un tableau :

```php
class Personne implements JsonSerializable {

    private $nom;

    private $prenom;

    private $age;

    private Ville $ville;

    public function jsonSerialize() : array {
        return [
            "nom" => $this->nom,
            "prenom" => $this->prenom,
            "age" => $this->age,
            "ville" => [
                "nom" => $this->ville->getNom(),
                "codePostal" => $this->ville->getCodePostal()
            ]
        ];
    }

}
```

Si l'attribut objet est lui-aussi serialisable (implémente aussi `JsonSerializable`), on pourrait directement faire ainsi :

```php
class Personne implements JsonSerializable {

    private $nom;

    private $prenom;

    private $age;

    private Ville $ville;

    public function jsonSerialize() : array {
        return [
            "nom" => $this->nom,
            "prenom" => $this->prenom,
            "age" => $this->age,
            "ville" => $this->ville->jsonSerialize()
        ];
    }

}
```

Mais dans ce cas, on ne peut pas sélectionner précisément ce qu'on renvoie de ce sous-objet (de la ville) dans le contexte de `Personne` (ici, c'est la classe `Ville` et sa méthode `jsonSerialize` qui décidera)

<div class="exercise">

1. Faites en sorte de rendre `Publication` sérialisable en `JSON`. Pour la `Date`, il faudra que celle-ci soit formatée, comme quand on l'affiche dans les templates `twig`. Pour l'utilisateur, on récupère seulement son identifiant, son nom et le nom de sa photo de profil.

2. Dans `app.php`, instanciez une nouvelle publication `$votrePublication`, puis utilisez un `setter` pour donner un identifiant fictif, puis appellez `var_dump` sur `json_serialize($votrePublication)` et observez le résultat en chargeant une de vos pages.

3. Supprimez ce test dans `app.php`.

4. Modifiez également la méthode `createNewPublication` dans `PublicationService` pour que l'identifiant de la publication qui vient d'être créée soit renvoyé.
 
</div>

Très bien, nous avons de quoi retourner une publication en `JSON` mais un autre problème se pose : comment récupérer la publication qui vient d'être créée alors qu'on ne connait pas son identifiant? En effet, la méthode `create` de `PublicationRepositorySQL` créé seulement la publication...Eh bien, encore une fois, tout est prévu!

Après l'éxécution d'une requête d'insertion dans la base, vous pouvez appeller la méthode suivante sur un objet `PDO` :

```php
$pdo->lastInsertId()
```

Ce code permet d'obtenir **le dernier identifiant** (clé primaire) inséré dans la base, donc, par exemple, dans le cadre d'une publication, son identifiant.

<div class="exercise">

Modifiez le code de la méthode `create` de `PublicationRepositorySQL` pour qu'elle renvoie l'identifiant de la publication qui vient d'être créée.

</div>

Maintenant, nous n'avons plus qu'à mettre en place la route, le controller et aussi un bout de service qui nous permettra de récupérer une publication précise.

Dans une requête envoyées vers une API, les données sont transmisses via un `payload` lui aussi encodé en `JSON`. Par exemple, pour un **feedy** :

```json
{
    "message": "Coucou!"
}
```

Il faut alors le décoder en tableau associatif, côté `PHP` :

```php
//Payload brut
$content = $request->getContent();

//Il faut vérifier que le $content n'est pas null avant de le traiter :

if($content) {

    //On obtient un tableau associatif
    $json = json_decode($content, true);

    //ternaire pour récupérer la valeur...On vérifie d'abord si la clé qu'on recherche existe ou non (sinon on lu i affecte null...)
    $message = array_key_exists("message", $json) ? $json["message"] : null;

    //Equivalent plus compact
    $message = $json["message"] ?? null;
}

```

<div class="exercise">

1. Dans `PublicationService`, ajotuez une méthode `getService($id, $allowNull = true)` qui permet de récupérer une publicaiton à partir de son identifiant en utilisant le repository. Comme nous l'avions fait pour les **utilisateurs**, si la publication n'existe pas et que le paramètre `$allowNull` vaut `false`, on doit **lever** une `ServiceException`.

2. Dans `src/Application`, créez un nouveau dossier `API` puis, à l'intérieur de ce nouveau répertoire, une classe `PublicationControllerAPI`. Donnez un `namespace` adéquat à cette classe et faites-là hériter de `Controller`.

3. Ajoutez une méthode `submitFeedy` qui prend en paramètre un `Request $request` et :

    1. Récupère le message depuis le payload `JSON` de la requête.

    2. Créé une nouvelle publication en utilisant le bon service avec ce message et, comme auteur, l'utilisateur courant. Récupérez l'identifiant de cette publication par la même occassion.

    3. Enfin, récupère la publication qui vient d'être créée en utilisant une nouvelle fois le bon service et la bonne méthode, puis, retourne une nouvelle instance de `JsonResponse` contenant la publication (pas besoin d'appeler la méthode de serialisation cela serz fait tout seul...).

    4. Il faut penser à englober les appels aux services dans des blocs `try/catch`. Si une `ServiceException` est attrapée, il faut simplement retourner :

        ```php
        //400 : Bad request
        new JsonResponse(["error" => $exception->getMessage()], 400);
        ```

        On fera de même si le `payload` n'existe pas (pas de contenu dans la requête...)

4. Enregistrez ce `controller` dans votre fichier de configuration global.

5. Ajoutez une nouvelle `route` ayant pour chemin `/api/feedy`, seulement accessible en `POST` et dirigeant vers l'action `submitFeedy` du controller créé dans cet exercice. Seuls des utilisateurs authentifiés doivent pouvoir accèder à cette route.

</div>

### Découverte de Postman

Tout est prêt, mais comment tester ce bout d'API? Pour cela, nous allons utiliser un petit logiciel très pratique quand on développe des `API` : **Postman**.  
Ce logiciel va permettre de paramètrer et d'envoyer des requêtes de manière interactive et de visualiser le résultat très simplement.

Le logiciel est installé sur vos machines, chez-vous, vous pouvez le télécharger [ici](https://www.postman.com/downloads/?utm_source=postman-home).

Nous allons donc tester notre toute nouvelle route grâce à ce logicel!

<div class="exercise">

1. Allumez **postman**. L'application vous propose de créer un compte, mais vous n'en avez pas besoin. Cliquez simplement sur "**Skip signing in and take me straight to the app**" tout en bas.

2. Sur l'interface, créez un nouvel onglet et paramétrez-le ainsi :

    <p style="text-align:center">
    ![Postman config 1]({{site.baseurl}}/assets/TD5/postman1.PNG)
    </p>

    * Méthode `POST`

    * Adresse : [http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD5/web/feedy](http://webinfo.iutmontp.univ-montp2.fr/~mon_login_IUT/TD5/web/feedy)

    * **Body** -> **raw** -> (changer **Text** en **JSON**) puis : 

    ```json
    {
        "message": "Hello world!"
    }
    ```

3. Cliquez sur "**Send**" et observez le résultat...Que se passe-t-il?

4. En effet, la route est protégée! Elle n'est donc accessible qu'aux utilisateurs authentifiés...On va donc fournir à **postman** pour identificaeur de session. Connectez-vous sur votre application puis éxécutez le code suivant dans la `console` du navigateur (`F12` -> `Console`) :

    ```javascript
    document.cookie
    ```

    Conservez bien ce résultat.

5. Sur **postman**, cliquez sur la section **Headers** de l'onglet. Ajoutez une nouvelle clé `Cookie` puis, comme valeur, collez la valeur que vous avez récupérez à la question précédente. Il s'agit de votre identifiant de session.

    <p style="text-align:center">
    ![Postman config 2]({{site.baseurl}}/assets/TD5/postman2.PNG)
    </p>

6. Tentez d'envoyer la requête à nouveau, le serveur devrait alors vous renvoyer la représentation `JSON` de votre nouveau **feedy**! Vous pouvez aussi directement aller consulter son ajout sur le site web.

</div>

### Un peu de javascript!

Nous allons maintenant directement intégrer notre `API` dans le fonctionnement du site. Un fichier `javascript` sera alors itnégré à la page et se chargera de faire des `requêtes asynchrones` vers l'API qui chargera les novuelles informations, dans la page. Vous n'aurez malheureusement pas le temps de développer ce fichier vous-même, vous devez donc le [télécharger ici]({{site.baseurl}}/assets/TD5/main.js).

<div class="exercise">

1. Prenez le temps de consulter le fichier `main.js`. Placez-le dans un dossier `assets/js` (vous devez créer le dossier `js`).

2. Dans votre template `base.html.twig`, intégrez ce fichier en le chargeant avec la ligne suivante, placée dans le `header`:

    ```twig
    {% raw %}
    <script type="text/javascript" src="{{ asset("js/main.js") }}"></script>
    {% endraw %}
    ```

3. Le `javascript` aura besoin de connaître l'adresse de base du site. Dans `TwigAppFrameworkExtension`, ajoutez une méthode `getBaseUrl` qui renvoie simplent l'URL de base à partir de `$context`. Ensuite, dans le template `base.html.twig`, dans le `body`, ajoutez simplement le code suivant qui va permettre de définir des variables globales accessibles pour le fichier `main.js` :

    ```twig
    {% raw %}
    <script type="text/javascript">
        var siteBase = "{{ getBaseUrl() }}";
        var apiBase = siteBase+"/api/"
        var pagePersoBase = siteBase+"/user/page/";
        var imgBase = "{{ asset("img") }}"
    </script>
    {% endraw %}
    ```
4. Dans le `form` du template `feed.html.twig`, supprimez les attributs `action` et `method` (on envoie plus directement de formulaire...) puis remplacez le bouton d'envoi par cet élément HTML :

    ```html
    <button type="button" id="feedy-new-submit" onclick="submitFeedy()">Feeder!</button>
    ```

5. Rechargez la page du `feed` puis tentez d'envoyer un nouveau **feedy**. Cela est maintenant fait dynamiquement via **l'API**! Vous pouvez consulter les échanges entre le client et le serveur dans l'onglet réseau du navigateur (`F12` -> `Réseau`).

</div>

### Supression dynamique des feedies

<div class="exercise">

1. Il vous est demandé de créer tout ce qu'il faut pour **supprimer** une publication : méthode dans le service, dans le controller, etc...puis de créer la route associée ayant pour chemin `/feedy/{id}`. Il faudra donc que l'id soit un **paramètre** de la route et de l'action associée dans le **controller**! Cette route ne devra être accessible qu'avec la méthode `DELETE` et seulement par les utilisateurs authentifié. Il faudra aussi lever des exceptions si la publication visée n'existe pas...ou si l'utilisateur qui tente de la supprimer **n'en est pas l'auteur**!

2. Testez votre route sur **postman** en supprimant des publications. Vous pouvez aller consulter les identifiants des publications sur la base de données.

3. Dans `feed.html.twig`, à la fin du `<div>` ayant pour id `feedy-info` (donc juste après le paragraphe contenant le message de la publication), ajoutez le code de ce bouton :

    ```twig
    {% raw %}
    <button class="delete-feedy" onclick="removeFeedy(this, {{ ??? }})">Supprimer</button>
    {% endraw %}
    ```

    Remplacez les `???` par le code adéquat.

4. Un bouton de supression devrait maintenant apparaitre à côté de tous les feedies. Tentez d'en supprimer un dont vous êtes l'auteur.

5. On voudrait que le bouton de suppression s'affiche sur l'interface de l'utilisateur qui accède à la page seulement s'il est l'auteur de la publication. Faites les modificaitons nécessaires sur le template pour obtenir ce résultat.

</div>

### Supression dynamique du compte

<div class="exercise">

1. Il vous est demandé de créer tout ce qu'il faut pour **supprimer** un compte : méthode dans le service, **nouveau controller**, etc...puis de créer la route associée ayant pour chemin `/utilisateur/{id}`. Il faudra donc que l'id soit un **paramètre** de la route et de l'action associée dans le **controller**! Cette route ne devra être accessible qu'avec la méthode `DELETE` et seulement par les utilisateurs authentifié. Il faudra aussi lever des exceptions si l'utilisateur visé n'existe pas...ou si l'utilisateur qui tente supprimer le compte **n'en est pas le proprietaire**!

    Pour cette question, vous aurez aussi besoin de :

    * Supprimer l'image de l'utilisateur (il n'en a plus besoin). Cela peut-être fait en utilisant la fonction `unlink` sur le chemin `asbolu` de l'image.

    * Déconnecter l'utilisateur.

2. Testez votre route sur **postman** en supprimant votre compte. Attention, il faut bien que le compte supprimé soit celui avec qui vous êtes connecté sur le site (lié à votre id de session paramétré dans **postman**). Si cela ne marche pas (si cela vous dit que vous n'êtes pas le porprietaire du compte), reconnectez-vous puis répétez les insctructions pour préciser l'id de la session à **postman**.

3. Dans `page_perso.html.twig`, ajotuez ce code html au tout début du `main` :

    ```twig
    {% raw %}
    <div class="center">
        <button id="btn-supprimer-compte" onclick="removeUser({{ ??? }})">Supprimer mon compte</button>
    </div>
    {% endraw %}
    ```

    Remplacez les `???` par le code adéquat.

4. Un bouton de supression devrait maintenant apparaitre sur les pages personnelles. Rendez-vous sur la vôtre (après vous être recréer un compte...) puis tentez de le supprimer.

5. On voudrait que le bouton de supression aparaisse seulement à l'utilisateur sur sa page personnelle quand il est connecté (qu'il ne le voit pas sur celles des autres et inversement). Faites les modificaitons nécessaires sur le template pour obtenir ce résultat.

</div>

### Authentification avec des JWT

Comme nous l'avons précisé plus tôt, notre `API` ne respecte pas le principe **stateless** car on utilise des `sessions` pour garder en mémoire que l'utilisateur est connecté et ainsi l'autoriser à accéder à des routes sécurisées ou bien supprimer ses propres ressources.

Pour changer cela tout en gardant le comportement désiré, on pourrait utiliser le mécanisme des `Json Web Tokens` (ou JWT) qui permettent au client de stocker les informations nécessaires de son côté. Le serveur stocke des informations dans ce `jeton` et dispose d'une `clé privée` secrète avec laquelle il `signe` cet entité de données envoyé au client. Le client peut librement lire et decoder ce `token` (jeton) mais ne peut pas le falsifier, car le serveur pourra le détecter (grâce au mécanisme de signature).

A chaque requête, le client envoie alors son `token`. Le serveur le décode et vérifie s'il n'a pas été altéré. Si tout va bien, il peut donc extraire l'information de ce token et l'utiliser en toute confiance (il n'a pas été altéré entre temps) sans avoir besoin de `sessions` et de maintenir un **état** côté back-end. 

On peut alors, par exemple, stocker des choses comme l'identifiant d'un utilisateur, pour savoir s'il est connecté ou non, comme nous le faisons actuellement. Attention néanmoins, contrairement aux essions, il ne faut pas stocker de donner sensibles dans le `JWT` car tout le monde peut facilement le décoder (sa sécurité réside dans le fait qu'il ne peut aps être falsifié seulement).

Nous n'aurons pas le temps d'approfondir ce sujet dans le cadre de ce cours, mais nous y reviendrons pendant les cours de développement mobile. Il suffira de faire une *légère* adaptation du framework pour accueillir une variante du service `ServerSessionManager` mis en place...Si cela vous intéresse, vous pouvez déjà chercher une soltuion! Nous utiliserons une librairie externe pour gérer les `JWT`.

## Conclusion

A travers ces quelques TPs, vous avez construit un `Framework` PHP assez complet (mais imparfait) vous permettant d'optimiser au mieux le développment d'une application. En l'état, vous pourriez très facilement exporter la partie `Framework` que nous avons développé de manière indépendante à notre application principale (**The Feed**) et l'utiliser pour un nouveau projet.

L'amélioration du **framework** ainsi que le développment d'une **nouvelle application** sont justement les deux sujets au coeur du [projet]({{site.baseurl}}/tutorials/projet.html)!