package com.mino.repository;

import com.mino.model.Professionnel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfessionnelRepository extends JpaRepository<Professionnel, String> {
    Optional<Professionnel> findByUtilisateurId(String utilisateurId);
}
