import 'commun/styles/situation.scss';

import 'commun/infra/report_erreurs';

import { afficheSituation } from 'commun/vues/affiche_situation';

import DepotRessourcesQuestions from 'questions/infra/depot_ressources_questions';
import Situation from 'questions/modeles/situation';
import VueSituation from 'questions/vues/situation';
import { IDENTIFIANT_SITUATION_QUESTIONS } from 'accueil/data/acces_situations';

const situation = new Situation({ questions: ['litteratie', 'numeratie'] });

const depotRessources = new DepotRessourcesQuestions();
afficheSituation(IDENTIFIANT_SITUATION_QUESTIONS, situation, VueSituation, depotRessources);
