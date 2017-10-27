// Dati di ChilliSpot
// IP e porta dove è in ascolto
var uamip = "";
var uamport = "";
// URL richiesto dall'utente appena collegato alla rete WiFi
var userurl = "";
// Challenge per criptare la password dell'utente di ChilliSpot
var challenge = "";

window.onload = function()
{
  parseRichiesta(location.search);
}

function parseRichiesta(querystring)
{
  // Il tipo di redirect viene specificato nella chiave "res" della query string
  var res = getParameterByName("res", querystring);
  // IP e porta dove è in ascolto ChilliSpot (specificati nella query string dal demone stesso)
  uamip = getParameterByName("uamip", querystring);
  uamport = getParameterByName("uamport", querystring);
  // URL richiesto dall'utente appena collegato alla rete WiFi
  userurl = getParameterByName("userurl", querystring);
  // Challenge per criptare la password dell'utente di ChilliSpot
  challenge = getParameterByName("challenge", querystring);

  // Se non sono presenti nè il tipo di redirect, nè IP e porta di ChilliSpot,
  //  la richiesta non è valida
  if (res === "" || uamip === "" || uamport === "") {
    mostraStato("Richiesta non valida.");
  } else if (res == "notyet") {
    // Il redirect è stato effettuato perché il dispositivo non è ancora loggato:
    //  - prima di mostrare il form di login, viene controllato se l'utente è già
    //    loggato su example.it: in questo caso gli viene garantito direttamente
    //    l'accesso ad internet e viene reindirizzato sulla sua pagina personale
    //    di example.it
    //    Per controllare se l'utente è già loggato su example.it, viene controllata
    //    la presenza e la validità del cookie contenente l'id di sessione (_session_id):
    //    è possibile accedere al cookie perché viene rilasciato da example.it con
    //    il dominio .example.it (quindi accessibile da tutti i sottodomini di example.it)
    //    Poiché la pagina web per l'accesso al Social WiFi e il web service
    //    risiedono sul dominio socialwifi.example.it, è possibile utilizzare il
    //    cookie per controllare se l'utente è loggato su example.it
    //  - se l'utente non è loggato su example.it, viene mostrato il form di login
    //  Quando il dispositivo si collega alla rete wifi, il browser
    //  potrebbe avere diverse schede aperte che, una volta rilevata la connessione
    //  WiFi, andra' a ricaricare in background e ogni pagina verrà reindirizzata
    //  da ChilliSpot con una richiesta notyet, ma una volta che l'utente avrà effettuato
    //  il login è inutile continuare a mostrare le pagine con il form di login. Il problema
    //  è risolvibile invitando l'utente a refreshare la pagina: richiesta ancora
    //  del tipo notyet, ma essendo l'utente già loggato su example.it non verrebbe rimostrato
    //  il form di login. Per evitare però di reindirizzare automaticamente l'utente
    //  sulla sua pagina personale di example, possiamo memorizzare in un cookie
    //  con scadenza giornaliera se è stata già mostrata la pagina personale.
    if (docCookies.getItem("_session_id")) {
      var richiestaWebservice = new XMLHttpRequest();
      richiestaWebservice.onreadystatechange = function() {
        if (richiestaWebservice.readyState === 4) {
          if (richiestaWebservice.status === 200) {
            // 200 OK dal web service --> il web service ha risposto con l'URL
            // per l'accesso su ChilliSpot --> redirect su ChilliSpot
            window.location.replace(richiestaWebservice.responseText);
          } else if (richiestaWebservice.status === 401) {
            // _session_id non valido
            mostraFormLogin();
          }
        }
      }

      richiestaWebservice.open("GET", "http://socialwifi.example.it/cgi-bin/controllo_sessione");
      richiestaWebservice.send();
    } else {
      // _session_id assente
      mostraFormLogin();
    }
  } else if (res == "already") {
    // Utente già loggato --> redirect sulla pagina che vuole visitare, o sulla
    // sua pagina personale su example.it se nel giorno in cui si sta collegando
    // non è ancora stata mostrata.
    // Dal momento in cui il parametro userurl viene utilizzato per trasferire le credenziali
    // dell'utente dal webservice al dispositivo (che poi inevitabilmente e inutilmente
    // invierà a ChilliSpot e quindi torneranno al dispositivo grazie al redirect
    // di ChilliSpot) per l'accesso su example.it controllo che l'userurl sia effettivamente un url
    if (userurl.substring(0,4) == "http" && docCookies.hasItem("dashboardMostrata")) {
      window.location.replace(userurl);
    } else {
      // Memorizzazione del cookie per sapere se è stata già mostrata la pagina
      // personale su example.it nel giorno in cui si collega l'utente
      docCookies.setItem("dashboardMostrata", "1", "86400", "/");
      window.location.replace("https://example.it/site/index.html#!/dashboard");
    }
  } else if (res == "success") {
    // Login effettuato con successo --> redirect sulla pagina personale su example.it
    // (redirect con window.location.href per consentire
    // all'utente di tornare sulla pagina che stava visitando)
    // e memorizzazione del cookie per sapere se è stata già mostrata la pagina personale
    // su example.it nel giorno in cui si sta collegando l'utente

    // Login dell'utente su example.it con le credenziali inserite, o con il token di Facebook
    // Le credenziali o il token di Facebook vengono inseriti nel parametro della querystring
    // userurl (inutilizzato perché una volta fatto il login l'utente deve essere reindirizzato
    // sulla sua pagina personale su example.it)
    credenziali = JSON.parse(userurl);
    // Login con un+pw
    if (credenziali.hasOwnProperty("user")) {
      // Viene inviata una richiesta XHR (che preveda la memorizzazione dei cookie)
      //    alle API di autenticazione di example
      var richiestaApi = new XMLHttpRequest();

      // Opzione per accettare i cookie
      richiestaApi.withCredentials = true;

      // TODO: redirect una volta ricevuta la risposta

      richiestaApi.open("POST", "https://example.it/users/sign_in.json")
      richiestaApi.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      richiestaApi.send(JSON.stringify(credenziali));
    } else if (credenziali.hasOwnProperty('fbToken')) {
      // Login con fb
    }

    docCookies.setItem("dashboardMostrata", "1", "86400", "/");
    window.location.href = "https://example.it/site/index.html#!/dashboard";
  } else if (res == "failed") {
    mostraStato("Login fallito: controlla le credenziali inserite.");
    mostraFormLogin();
  } else if (res == "logoff") {
    // Logout --> redirect su example.it
    window.location.replace("https://example.it");
  } else {
    // Tipo di richiesta sconosciuta
    mostraStato("Richiesta sconosciuta.");
  }
}

// Funzione per nascondere lo stato mostrato attualmente
function nascondiStato()
{
  bloccoStato = document.getElementById("bloccoStato");

  for (i=0; i < bloccoStato.childNodes.length; i++) {
    bloccoStato.removeChild(bloccoStato.childNodes[0]);
  }
}

// Funzione per mostrare lo stato del dispositivo all'utente
function mostraStato(stato)
{
  bloccoStato = document.getElementById("bloccoStato");
  p = document.createElement("p");
  p.appendChild(document.createTextNode(stato));

  nascondiStato();

  bloccoStato.appendChild(p);
}

// Funzione per mostrare il form di login
function mostraFormLogin()
{
  document.getElementById("bloccoFormLogin").style.display = "block";
}

/* Per effettuare il login sul social wifi bisogna inviare una richiesta a ChilliSpot
 * con le credenziali dell'utente (criptate per motivi di sicurezza). L'autenticità
 * delle credenziali inserite dall'utente viene controllata dal web service che, nel
 * caso siano valide, produrrà l'url della richiesta da inviare a ChilliSpot.
 */
function inviaFormLogin(formLogin)
{
  // Viene inviato il form con le credenziali al web service, che, nel caso in cui
  // le credenziali siano valide, risponderà con un 200 OK contenente l'URL per la
  // richiesta a ChilliSpot. Il web service imposterà anche il cookie _session_id
  // per registrare la sessione aperta dal webservice su example.it, in modo tale
  // da reindirizzare l'utente sulla sua pagina personale senza richiedergli
  // nuovamente le credenziali.
  // Se si vuole evitare che il webservice imposti cookie per conto di example.it,
  // è possibile inviare con una richiesta XHR le credenziali direttamente a example.it
  // (sicuramente valide dal momento in cui sono state guà controllate dal web service)
  // in modo tale da far impostare il cookie di sessione direttamente da example.it
  // poiché i cookie vengono impostati anche con le richieste XHR.
  // Allo stesso modo per l'autenticazione con Facebook è possibile inviare il token
  // a example.it con una richiesta XHR

  // Form convertito in un oggetto FormData per un invio più bello, orah.
  var formData = new FormData(formLogin);

  // Dati di ChilliSpot aggiunti al form
  formData.append("uamip", uamip);
  formData.append("uamport", uamport);
  formData.append("challenge", challenge);

  var richiestaWebservice = new XMLHttpRequest();
  richiestaWebservice.onreadystatechange = function() {
    if (richiestaWebservice.readyState === 4) {
      if (richiestaWebservice.status === 200) {
        // 200 OK dal web service --> il web service ha risposto con l'URL
        // per l'accesso su ChilliSpot

        // Redirect su ChilliSpot con l'URL prodotto dal webservice
        window.location.href = richiestaWebservice.responseText;
      } else if (richiestaWebservice.status === 401) {
        // Credenziali non valide
        mostraStato("Credenziali non valide.");
        mostraFormLogin();
      }
    }
  }

  richiestaWebservice.open("POST", "http://socialwifi.example.it/cgi-bin/login");
  richiestaWebservice.send(formData);
}

// Funzione per il parsing della query string (http://stackoverflow.com/a/901144)
function getParameterByName(name, querystring)
{
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(querystring);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  Revision #1 - September 4, 2014
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path[, domain]])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var docCookies = {
  getItem: function (sKey) {
    if (!sKey) { return null; }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    if (!sKey) { return false; }
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};
