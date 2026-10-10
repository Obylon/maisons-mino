package com.mino.controller;

import com.mino.dto.RessourceDtos.RessourceRequest;
import com.mino.dto.RessourceDtos.RessourceResponse;
import com.mino.model.Ressource;
import com.mino.repository.RessourceRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Bibliothèque de ressources — publiées par la coordinatrice.
 * Tout utilisateur authentifié peut lire les ressources publiées et
 * télécharger les pièces jointes.
 */
@RestController
@RequestMapping("/api/ressources")
@RequiredArgsConstructor
public class RessourceController {

    private final RessourceRepository ressourceRepository;

    @GetMapping("/publiees")
    public ResponseEntity<List<RessourceResponse>> listerPubliees() {
        return ResponseEntity.ok(
                ressourceRepository.findByPublieeTrue().stream().map(this::toResponse).toList()
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<RessourceResponse>> listerTout() {
        return ResponseEntity.ok(
                ressourceRepository.findAllByOrderByDatePublicationDesc().stream().map(this::toResponse).toList()
        );
    }

    @PostMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<RessourceResponse> creer(@Valid @RequestBody RessourceRequest request) {
        Ressource r = new Ressource();
        appliquer(r, request);
        r.setDatePublication(LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(ressourceRepository.save(r)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<RessourceResponse> modifier(@PathVariable String id,
                                                       @Valid @RequestBody RessourceRequest request) {
        Ressource r = charger(id);
        appliquer(r, request);
        return ResponseEntity.ok(toResponse(ressourceRepository.save(r)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        ressourceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Pièces jointes ────────────────────────────────────────────────────────

    @PostMapping(value = "/{id}/fichier", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<RessourceResponse> uploadFichier(@PathVariable String id,
                                                            @RequestParam("fichier") MultipartFile fichier) throws IOException {
        Ressource r = charger(id);
        r.setFichierData(fichier.getBytes());
        r.setNomFichier(fichier.getOriginalFilename());
        r.setTypeFichier(fichier.getContentType());
        r.setHasFichier(true);
        return ResponseEntity.ok(toResponse(ressourceRepository.save(r)));
    }

    @GetMapping("/{id}/fichier")
    public ResponseEntity<byte[]> telechargerFichier(@PathVariable String id) {
        Ressource r = charger(id);
        if (!r.isHasFichier() || r.getFichierData() == null) {
            return ResponseEntity.notFound().build();
        }
        String contentType = r.getTypeFichier() != null ? r.getTypeFichier() : "application/octet-stream";
        String nomFichier  = r.getNomFichier()  != null ? r.getNomFichier()  : "fichier";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nomFichier + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(r.getFichierData());
    }

    @DeleteMapping("/{id}/fichier")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<Void> supprimerFichier(@PathVariable String id) {
        Ressource r = charger(id);
        r.setFichierData(null);
        r.setNomFichier(null);
        r.setTypeFichier(null);
        r.setHasFichier(false);
        ressourceRepository.save(r);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Ressource charger(String id) {
        return ressourceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Ressource introuvable : " + id));
    }

    private void appliquer(Ressource r, RessourceRequest req) {
        r.setTitre(req.titre());
        r.setDescription(req.description());
        r.setCategorie(req.categorie());
        r.setUrl(req.url());
        r.setContenu(req.contenu());
        r.setPubliee(req.publiee());
    }

    private RessourceResponse toResponse(Ressource r) {
        return new RessourceResponse(
                r.getId(), r.getTitre(), r.getDescription(),
                r.getCategorie(), r.getUrl(), r.getContenu(),
                r.getDatePublication(), r.isPubliee(),
                r.isHasFichier(), r.getNomFichier(), r.getTypeFichier()
        );
    }
}
