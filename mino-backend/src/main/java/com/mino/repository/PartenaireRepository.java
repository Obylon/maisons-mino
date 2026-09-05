package com.mino.repository;

import com.mino.model.Partenaire;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartenaireRepository extends JpaRepository<Partenaire, String> {
    List<Partenaire> findByMamanId(String mamanId);
}
