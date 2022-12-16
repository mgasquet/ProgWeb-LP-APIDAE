---
title: Projet
subtitle: Framework, Application
layout: tutorial
lang: fr
---

## Sujet

Votre projet de **developpement web** en PHP se fera en **trinôme** et s'intéressera à **l'améliroation** du `framework` développé pendant les travaux pratiques ainsi que le développement d'une applciation web se basant sur ce `framework`.

### Amélioration du Framework

Pour cette partie, vous commencez directement avec le code final obtenu à l'issue des TPs (voir section [aide et accompagnement](#Aide et accompagnement)). Comme nous l'avons souligné lors de la conclusiion du dernier TP, le framework construit est assez complet mais imparfait et peut encore être étendu et amélioré!

Votre objectif est donc de reprendre ce code et de développer des **améliorations** et/ou **extensions** de ce `framework`.

Quelques pistes :

* Des fichiers de configurations Non-PHP? (**YAML**, **XML**...)

* Enregistrement des services sans utiliser une fonction statique?

* Certaines parties de la configuration optionnelles?

* Des nouveaux repository manager pour gérer d'autres sources de données? (XML, CSV, fichier texte...)

* Ajout d'un service pour envoyer des mails?

* Ajout d'un service pour générer des documents PDF?

* Gestions de divers événements?

* Laisser le choix au développeur entre l'utilisation de templates `twig` ou bien des fichiers `php` basiques, pour les vues?

* Ajout d'un ORM (object relational mapper) pour gérer toute la partie `repository` SQL? (par exemple, doctrine)

Tout cela ne sont bien sûr que des pistes et vous pouvez rechercher vos propres idées! Vous pouvez aussi trouver différentes librairies que vous pouvez inclure dans votre framework pour proposer de nouveaux services.

Au niveau de la quantité, on vous demande de proposer au moins **2-3 améliorations** et/ou extensions assez importantes. Bien sûr, vous pouvez en ajouter plus. Une très grosse amélioration (qui demande beaucoup de code, beacoup de travail) pourra compter pour plusieurs. Tout dépendra de la **qualité** de ce que vous ajoutez.

### Développement d'une application

En parallèle, vous devrez utiliser votre framework pour développer **une application** sur le thème de votre choix (à part un réseau social!). Quelques idées en vrac :

* Un petit site de vente en ligne (factice) d'un ou plusieurs produits.

* Un petit site pour organiser la Code Gam Jam (inscrire les équipes, déposer et présenter l'application finale...)

* Une application de vote Oui/Non sur des sujets lancés par des utilisateurs.

* Un site où les utilisateurs peuvent créer des tableaux pense-bêtes collaboratifs.

* Un mini "bon-coin".

* Un site de partage d'images, pour les artistes.

* Un mini youtube.

Bref, vous êtes totalement libre sur le choix du thème. Veillez juste à ce que cela ne soit aps trop ambitieux à réaliser dans le temps impartit. Il y aura néanmoins quelques petites contraintes à respecter :

* Pas deux fois le même sujet de site entre deux groupes. Vous devrez faire valider votre sujet.

* Au moins **trois tables** dans la **base de données** et qui ont des **relations** (donc au moins trois entités).

* Le site doit pouvoir gérer des **utilisateurs**, donc un système d'inscription et de connexion.

* Votre application doit proposer **au moins deux environnements** : un environnement de production et un environnement de développment (vous pouvez en ajouter d'autres, si besoin) configurés différemment, au moins pour la partie **stockage** (informations pas stockées sur la même base entre les deux environnements)

## Rendu

Le rendu devra se faire au plus tard le *(date à définir!)* sous deux formes : Hebergement du site et dépôt sur Moodle.

### Hebergement du site

Un seul membre du trinôme hébergera le site web dans son dossier `public_html`. Il faudra bien vérifier que le site web est accessible depuis l'extérieur de l'iut sur l'adresse : [http://webinfo.iutmontp.univ-montp2.fr/~login_depot/votreprojet/web/](http://webinfo.iutmontp.univ-montp2.fr/~login_depot/votreprojet/web/).

Si vous n'aviez pas fini les TPs, il ne faut pas oublier de donner les droits d'écriture au serveur de l'iut :

```bash
setfacl -R -m u:www-data:r-w-x ~/public_html
setfacl -R -m d:u:www-data:r-w-x ~/public_html
```

### Dépôt moodle

Sur **Moodle**, un seul membre du trinôme dépose une archive **zip** nommée selon le pattern : `NomPrenomMembre1-NomPrenomMembre2-NomPrenomMembre3.zip`. Cette archive devra contenir :

* Les sources de votre projet (framework + application) **sans le dossier vendor**

* Un fichier **README** qui contient :

    * Un lien vers la page web où est hebergé le site.

    * Une présentation des améliorations / extensions ajoutées au framework et, si nécessaire, comment les utiliser (documentation, comment les intégrer à un projet...).

    * Une présentation de l'application web produite, ses fonctionnalités, etc...

    * Un récapitulatif de l'investissement de chaque membre du groupe dans le projet (globalement, qui à fait quoi).

## Aide et accompagnement

Pour vous aider, vous pouvez partir de la [correction finale des TPs]({{site.baseurl}}/assets/projet/correction_finale.zip) qui contient les sources du `framework` et de l'application tel qu'ils devraient être à la fin du cinquième TP. Il y a aussi un fichier `database_strucure.sql` que vous pouvez charger dans une base de données `MySQL` pour avoir la structure finale de la base.

Pour toute question, vous pouvez me contacter ici : [malo.gasquet@umontpellier.fr](mailto:malo.gasquet@umontpellier.fr)