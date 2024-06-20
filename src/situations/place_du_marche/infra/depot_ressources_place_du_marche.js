import DepotRessourcesCommunes from 'commun/infra/depot_ressources_communes';
import sonConsigne from 'cafe_de_la_place/assets/consigne_cafe_de_la_place.mp3';
import fondSituation from 'bienvenue/assets/bienvenue_background.jpg';


const messagesAudios = {};

const messagesVideos = {};

export default class DepotRessourcesCafeDeLaPlace extends DepotRessourcesCommunes {
  constructor (chargeurs) {
    super(chargeurs, messagesVideos, messagesAudios, null, sonConsigne);
    this.charge([fondSituation]);
  }

  illustrationQuestion () {
    return this.ressource(fondSituation);
  }
}
