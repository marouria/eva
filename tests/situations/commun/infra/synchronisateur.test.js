import Synchronisateur from 'commun/infra/synchronisateur';
import RegistreUtilisateur from 'commun/infra/registre_utilisateur';
import RegistreEvenements from 'commun/infra/registre_evenements';

describe('Synchronisateur', function () {
  let registreUtilisateur;
  let registreEvenements;
  let synchronisateur;

  beforeEach(function () {
    registreUtilisateur = new RegistreUtilisateur();
    registreEvenements = new RegistreEvenements();

    synchronisateur = new Synchronisateur(registreUtilisateur, registreEvenements);
  });

  describe('#recupereReseau()', function () {
    let creeEvenements;
    let supprimeEvaluationLocale;

    beforeEach(function () {
      creeEvenements = jest.spyOn(registreEvenements, 'creeEvenements')
        .mockImplementation(() => {
          return Promise.resolve();
        });
      supprimeEvaluationLocale = jest.spyOn(registreUtilisateur, 'supprimeEvaluationLocale');

      window.localStorage.clear();
    });

    describe("quand l'évaluation n'existe pas coté serveur", function () {
      let creeEvaluation;

      beforeEach(function () {
        window.localStorage.setItem('evaluation_1', JSON.stringify({ nom: 'Marcelle', code_campagne: 'CODE' }));
        window.localStorage.setItem('evaluation_2', JSON.stringify({ nom: 'Clement', code_campagne: 'CODE' }));

        let evaluationId = 0;
        creeEvaluation = jest.spyOn(registreUtilisateur, 'creeEvaluation')
          .mockImplementation((data) => {
            evaluationId += 1;
            return Promise.resolve({ ...data, id: 'evaluation_' + evaluationId });
          });
      });

      it('enregistre une évaluation locale', function () {
        synchronisateur.recupereReseau();

        expect(creeEvaluation).toHaveBeenCalledTimes(2);
        expect(creeEvaluation).toHaveBeenLastCalledWith({ nom: 'Clement', code_campagne: 'CODE' });
      });

      it("enregistre dans le localstorage l'évaluation créée", function (done) {
        synchronisateur.recupereReseau();

        setTimeout(() => {
          expect(window.localStorage.getItem('evaluation_1')).toEqual('{"nom":"Marcelle","code_campagne":"CODE","id":"evaluation_1"}');
          done();
        });
      });

      it('synchronise les évènements pour chaque évaluation', function (done) {
        synchronisateur.recupereReseau();

        setTimeout(() => {
          expect(creeEvenements).toHaveBeenCalledTimes(2);
          expect(creeEvenements).toHaveBeenNthCalledWith(1, '1', 'evaluation_1');
          expect(creeEvenements).toHaveBeenNthCalledWith(2, '2', 'evaluation_2');

          done();
        });
      });

      it("supprime l'évaluation terminée du localStorage", function (done) {
        window.localStorage.setItem('evaluation_3', JSON.stringify({ nom: 'Clement', code_campagne: 'CODE', terminee_le: new Date() }));

        synchronisateur.recupereReseau();

        setTimeout(() => {
          expect(supprimeEvaluationLocale).toHaveBeenCalledTimes(1);

          done();
        });
      });
    });

    describe("quand l'évaluation existe coté serveur", function () {
      beforeEach(function () {
        window.localStorage.setItem('evaluation_1',
          JSON.stringify({ id: 1, email: 'Marcelle@paris.fr', telephone: '061234567' }));
      });

      it("Met à jour les informations de contact au cas où elles n'auraient pas été envoyées", function () {
        const enregistreContact = jest.spyOn(registreUtilisateur, 'enregistreContact')
          .mockImplementation((data) => {
            return Promise.resolve(data);
          });
        synchronisateur.recupereReseau();
        expect(enregistreContact).toHaveBeenCalled();
        expect(enregistreContact).toHaveBeenLastCalledWith(1, 'Marcelle@paris.fr', '061234567');
      });
    });

    describe('ne peut être appelé deux fois en même temps', function () {
      let resoudLaPremierePromesse;
      let rejeteLaPremierePromesse;
      let promesse;
      let echecSynchronisation;

      beforeEach(() => {
        promesse = new Promise((resolve, reject) => {
          resoudLaPremierePromesse = resolve;
          rejeteLaPremierePromesse = reject;
        });
        echecSynchronisation = jest.spyOn(synchronisateur, 'echecSynchronisation')
          .mockImplementation(() => {});
      });

      it('attend la fin de #creeEvaluation', function (done) {
        window.localStorage.setItem('evaluation_1', JSON.stringify({ nom: 'Marcelle', code_campagne: 'CODE' }));

        const creeEvaluation = jest.spyOn(registreUtilisateur, 'creeEvaluation')
          .mockImplementation(() => {
            return promesse;
          });

        synchronisateur.recupereReseau();
        expect(creeEvaluation).toHaveBeenCalledTimes(1);

        setTimeout(() => {
          synchronisateur.recupereReseau();
          expect(creeEvaluation).toHaveBeenCalledTimes(1);

          rejeteLaPremierePromesse('une erreur');
          setTimeout(() => {
            expect(echecSynchronisation).toHaveBeenCalledWith('une erreur');
            synchronisateur.recupereReseau();
            expect(creeEvaluation).toHaveBeenCalledTimes(2);
            done();
          });
        });
      });

      it('attend la fin de #enregistreContact', function (done) {
        window.localStorage.setItem('evaluation_1',
          JSON.stringify({ id: 1, email: 'Marcelle@paris.fr', telephone: '061234567' }));

        const spy = jest.spyOn(registreUtilisateur, 'enregistreContact')
          .mockImplementation(() => {
            return promesse;
          });

        synchronisateur.recupereReseau();
        expect(spy).toHaveBeenCalledTimes(1);

        setTimeout(() => {
          synchronisateur.recupereReseau();
          expect(spy).toHaveBeenCalledTimes(1);

          resoudLaPremierePromesse({ id: 1 });
          setTimeout(() => {
            synchronisateur.recupereReseau();
            expect(spy).toHaveBeenCalledTimes(2);
            done();
          });
        });
      });
    });

    describe('récupère les erreurs', function () {
      const spy = {};

      beforeEach(() => {
        spy.error = jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        spy.error.mockRestore();
      });

      it("lors de l'enregistrement des evenements", function (done) {
        const erreur = new Error('erreur enregistrement evenement');
        window.localStorage.setItem('evaluation_1',
          JSON.stringify({ id: 1, email: 'Marcelle@paris.fr', telephone: '061234567' }));

        jest.spyOn(registreUtilisateur, 'enregistreContact')
          .mockImplementation(() => {
            return Promise.resolve({ id: '1' });
          });

        jest.spyOn(registreEvenements, 'creeEvenements')
          .mockImplementation(() => {
            return Promise.reject(erreur);
          });

        synchronisateur.recupereReseau();

        setTimeout(() => {
          expect(spy.error).toHaveBeenCalledWith(erreur);
          done();
        });
      });
    });
  });

  describe('#supprimeEvaluationDuLocal()', function () {
    let evaluation;
    let supprimeEvaluationLocale;
    const idClient = 'id_client';

    beforeEach(function () {
      supprimeEvaluationLocale = jest.spyOn(registreUtilisateur, 'supprimeEvaluationLocale');
    });

    describe("quand l'évaluation est terminée", function () {
      beforeEach(function () {
        evaluation = { terminee_le: Date.now() };
        window.localStorage.setItem('evaluation_id_client', JSON.stringify(evaluation));
      });

      it("supprime l'évaluation du localStorage", function () {
        synchronisateur.supprimeEvaluationDuLocal(idClient, evaluation);

        expect(supprimeEvaluationLocale).toHaveBeenCalledTimes(1);
      });
    });

    describe("quand l'évaluation n'est pas terminée", function () {
      beforeEach(function () {
        evaluation = { id: 1 };
        window.localStorage.setItem('evaluation_id_client', JSON.stringify(evaluation));
      });

      it('ne fais rien', function () {
        synchronisateur.supprimeEvaluationDuLocal(idClient, evaluation);

        expect(supprimeEvaluationLocale).toHaveBeenCalledTimes(0);
      });
    });
  });
});
