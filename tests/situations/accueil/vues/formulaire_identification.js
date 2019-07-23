import jsdom from 'jsdom-global';
import jQuery from 'jquery';
import EventEmitter from 'events';
import { traduction } from 'commun/infra/internationalisation';

import { CHANGEMENT_CONNEXION } from 'commun/infra/registre_utilisateur';
import FormulaireIdentification from 'accueil/vues/formulaire_identification';

describe("Le formulaire d'identification", function () {
  let $;
  let vue;
  let registreUtilisateur;

  beforeEach(function () {
    jsdom('<div id="formulaire"></div>');
    $ = jQuery(window);
    registreUtilisateur = new class extends EventEmitter {
      estConnecte () {}
      inscris () { return $.Deferred(); }
      nom () {}
    }();
    vue = new FormulaireIdentification(registreUtilisateur);
  });

  it("s'affiche", function () {
    expect($('#formulaire form').length).to.equal(0);

    vue.affiche('#formulaire', $);
    expect($('#formulaire form#formulaire-identification').length).to.equal(1);
    expect($('#formulaire label').length).to.equal(2);
    expect($('#formulaire input[type=text]').length).to.equal(2);
  });

  it("sauvegarde la valeur rentrée à l'appui sur le bouton", function (done) {
    registreUtilisateur.inscris = (identifiantUtilisateur, codeCampagne) => {
      expect(identifiantUtilisateur).to.equal('Mon pseudo');
      expect(codeCampagne).to.equal('Mon code campagne');
      done();
    };
    vue.affiche('#formulaire', $);
    $('#formulaire #formulaire-identification-input-campagne').val('Mon code campagne');
    $('#formulaire #formulaire-identification-input-nom').val('Mon pseudo').trigger('submit');
  });

  it("réinitialise la valeur rentrée à l'appui sur le bouton", function () {
    vue.affiche('#formulaire', $);
    $('#formulaire input[type=text]').each(function () {
      $(this).val('Mon pseudo ou code');
    });
    $('#formulaire input[type=text]').trigger('submit');

    $('#formulaire input[type=text]').each(function () {
      expect($(this).val()).to.eql('');
    });
  });

  it('ne sauvegarde pas la valeur rentrée si elle est vide', function () {
    registreUtilisateur.inscris = () => { throw new Error('ne devrait pas être appellé'); };
    vue.affiche('#formulaire', $);
    $('#formulaire input[type=text]').val('').trigger('submit');
  });

  it("cache le formulaire lors que l'évalué·e est connecté·e", function () {
    registreUtilisateur.estConnecte = () => true;
    vue.affiche('#formulaire', $);
    expect($('#formulaire #formulaire-identification').hasClass('invisible')).to.eql(true);
  });

  it("affiche le formulaire lorsque l'évalué·e se connecte", function () {
    registreUtilisateur.estConnecte = () => false;
    vue.affiche('#formulaire', $);
    expect($('#formulaire #formulaire-identification').hasClass('invisible')).to.eql(false);
    registreUtilisateur.estConnecte = () => true;
    registreUtilisateur.emit(CHANGEMENT_CONNEXION);
    expect($('#formulaire #formulaire-identification').hasClass('invisible')).to.eql(true);
  });

  it("affiche une erreur si le code campagne n'existe pas", function () {
    registreUtilisateur.inscris = (identifiantUtilisateur, codeCampagne) => {
      return $.Deferred().reject({ status: 404 });
    };
    vue.affiche('#formulaire', $);
    expect($('.erreur').length).to.equal(0);
    $('#formulaire #formulaire-identification-input-nom').val('Mon pseudo').trigger('submit');
    expect($('.erreur').text()).to.equal(traduction('accueil.identification.erreur_code_campagne'));
  });

  it('affiche une erreur générique', function () {
    registreUtilisateur.inscris = (identifiantUtilisateur, codeCampagne) => {
      return $.Deferred().reject({ status: 422 });
    };
    vue.affiche('#formulaire', $);
    expect($('.erreur').length).to.equal(0);
    $('#formulaire #formulaire-identification-input-nom').val('Mon pseudo').trigger('submit');
    expect($('.erreur').text()).to.equal(traduction('accueil.identification.erreur_generique'));
  });

  it("enlève l'erreur lorsque l'on resoumet le formulaire", function () {
    registreUtilisateur.inscris = (identifiantUtilisateur, codeCampagne) => {
      return $.Deferred().reject({ status: 422 });
    };
    vue.affiche('#formulaire', $);
    expect($('.erreur').length).to.equal(0);
    $('#formulaire #formulaire-identification-input-nom').val('Mon pseudo').trigger('submit');
    expect($('.erreur').length).to.equal(1);
    $('#formulaire #formulaire-identification-input-nom').val('Mon pseudo').trigger('submit');
    expect($('.erreur').length).to.equal(1);
  });
});
