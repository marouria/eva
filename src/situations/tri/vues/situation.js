import 'tri/styles/situation.scss';
import { PIECE_BIEN_PLACEE, PIECE_MAL_PLACEE } from 'tri/modeles/piece';
import VueBac from 'commun/vues/bac.js';
import VuePiece from 'tri/vues/piece.js';
import VueResultat from 'commun/vues/resultat.js';
import DeplaceurPieces from 'commun/composants/deplaceur_pieces';
import EvenementPieceBienPlacee from 'commun/modeles/evenement_piece_bien_placee';
import EvenementPieceMalPlacee from 'commun/modeles/evenement_piece_mal_placee';

export default class VueSituationTri {
  constructor (situation, journal, depotRessources) {
    this.depotRessources = depotRessources;
    this.situation = situation;
    this.deplaceurPieces = new DeplaceurPieces(situation);
    this.resultat = new VueResultat(situation, 'tri');
    this.envoiEvenementsAuJournal(journal);
  }

  affiche (pointInsertion, $) {
    $(pointInsertion).addClass('tri')
      .css('background-image', `url('${this.depotRessources.fondSituation().src}')`);

    this.situation.piecesAffichees().forEach((piece) => {
      const vuePiece = new VuePiece(piece, this.depotRessources);
      vuePiece.affiche(pointInsertion, $);
    });

    this.situation.bacs().forEach((bac) => {
      const vueBac = new VueBac(bac);
      vueBac.affiche(pointInsertion, $);
    });

    this.deplaceurPieces.activeDeplacementPieces(pointInsertion, $);
    this.resultat.affiche(pointInsertion, $);
  }

  envoiEvenementsAuJournal (journal) {
    const envoiEvenementPiece = (Classe) => {
      return (piece, bac) => {
        const categorieBac = bac ? bac.categorie() : null;
        journal.enregistre(new Classe({ piece: piece.categorie(), bac: categorieBac }));
      };
    };
    this.situation.on(PIECE_BIEN_PLACEE, envoiEvenementPiece(EvenementPieceBienPlacee));
    this.situation.on(PIECE_MAL_PLACEE, envoiEvenementPiece(EvenementPieceMalPlacee));
  }
}
