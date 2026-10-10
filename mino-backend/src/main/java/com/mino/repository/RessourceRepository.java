package com.mino.repository;

import com.mino.model.Ressource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RessourceRepository extends JpaRepository<Ressource, String> {
    List<Ressource> findByPublieeTrue();
    List<Ressource> findAllByOrderByDatePublicationDesc();
}
