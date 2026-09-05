package com.mino.repository;

import com.mino.model.Dossier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DossierRepository extends JpaRepository<Dossier, String> {
    Optional<Dossier> findByUtilisateurIdOrigine(String utilisateurIdOrigine);
}
