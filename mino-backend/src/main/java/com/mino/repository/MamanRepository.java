package com.mino.repository;

import com.mino.model.Maman;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MamanRepository extends JpaRepository<Maman, String> {
    Optional<Maman> findByUtilisateurId(String utilisateurId);
    List<Maman> findByGroupeId(String groupeId);
    List<Maman> findByCohorteId(String cohorteId);
}
