package com.mino.repository;

import com.mino.model.InscriptionAtelier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InscriptionAtelierRepository extends JpaRepository<InscriptionAtelier, String> {
    List<InscriptionAtelier> findByAtelierId(String atelierId);
    List<InscriptionAtelier> findByUtilisateurId(String utilisateurId);
}
