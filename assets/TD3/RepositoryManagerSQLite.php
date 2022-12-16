<?php

namespace Framework\Storage\SQL;

use PDO;
use Framework\Storage\RepositoryManager;

class RepositoryManagerSQLite extends RepositoryManager
{
    private $pdo;

    public function __construct($dataBaseConfig)
    {
        $fileName = $dataBaseConfig['file'];
        $this->pdo = new PDO("sqlite:$fileName");
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function registerRepository($entityClass, $repositoryClass) {
        $repository = new $repositoryClass($this->pdo);
        $this->repositories[$entityClass] = $repository;
    }
}