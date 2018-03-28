# SHITTY OLD DIDACTIC PROJECT
___

# Social WiFi example.it

Il Social WiFi di example.it è un servizio di hotspot pubblico realizzato
tramite l'utilizzo di un captive portal (ChilliSpot) opportunamente implementato
per permettere agli utenti registrati su example.it la navigazione in internet
tramite le reti WiFi di example.it.

### Funzionamento base di ChilliSpot
ChilliSpot è un captive portal che, come tale, permette l'autenticazione tramite
web login degli utenti che si connettono ad un hotspot pubblico. ChilliSpot è un
demone (nel nostro caso in esecuzione direttamente sugli Access Point) che
intercetta e gestisce tutte le connessioni effettuate tramite la rete WiFi
dell'hotspot. Nel momento in cui l'utente accede con il suo dispositivo alla
rete WiFi, ChilliSpot controlla lo "stato" in cui si trova e, nel caso in cui
non sia ancora loggato al portale web, lo reindirizza alla pagina di login. La
pagina web per il login non è prodotta da ChilliSpot, bensì risiede su un server
web esterno. Quando l'utente inserisce le proprie credenziali, queste vengono
spedite al server web che, dopo averle criptate, ...?

### Funzionamento JS
La pagina viene caricata dopo che il dispositivo viene reindirizzato dal demone
di ChilliSpot. La pagina sulla quale viene reindirizzato il dispositivo è sempre
la stessa indipendentemente dal tipo di reindirizzamento (login fallito, login
non ancora effettuato, ecc), ma viene aggiunto da ChilliSpot un parametro nella
query string dell'url di redirect che ci fa capire lo "stato" in cui si trova il
dispositivo. Quindi per prima cosa bisogna fare il parsing della query string
per costruire la pagina da mostrare all'utente.
