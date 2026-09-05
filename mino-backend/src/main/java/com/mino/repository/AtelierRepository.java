package com.mino.repository;

import com.mino.model.Atelier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AtelierRepository extends JpaRepository<Atelier, String> {
    /** Utilisé pour filtrer les ateliers d'un professionnel — un pro ne doit voir que les siens. */
    List<Atelier> findByProfessionnelId(String professionnelId);
    List<Atelier> findByGroupeId(String groupeId);
    List<Atelier> findByRappelEnvoyeFalse();
}
