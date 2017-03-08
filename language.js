/**
 * Created by Matthias Heinen on 04.03.2017.
 */
var languageString = {

    "de": {
        "translation": {
            "WELCOME_MESSAGE" : "Willkommen bei Webcomputing!",
            "START_GROUPING" : "Wollen Sie die Daten noch zusammenfassen?",
            "START_GROUPING_REPEAT" : "Daten zusammenfassen? <break time='1s'/>Ja oder Nein?",
            "DID_NOT_UNDERSTAND": "Ich habe Sie leider nicht verstanden!",
            "HELP_SELECT": "Sagen Sie beispielsweise <break time='200ms'/> Wähle alle Kunden mit Umsatz größer hundert"+
            "<break time='200ms'/> Wobei Kunden der Name der Tabelle oder des <say-as interpret-as='characters'>csv</say-as> " +
            "ist und Umsatz der Name der Spalte",
            "END_SESSION": "Dann bis zum nächsten mal!",
            "END_QUESTION": "Analyse beenden?",
            "ANOTHER_SELECT": "Wählen Sie bitte die neuen Daten aus",
            "GROUPING": "Wählen Sie die Art der Zusammenfassung und  gegebenenfalls die Spalte.",
            "HELP_GROUPING": "Sagen Sie beispielsweise <break time='200ms'/> Zusammenfassen nach Umsatz, <break time='200ms'/>" +
            "um den Umsatz zusammenzufassen. Sie können auch mit <break time='200ms'/> Bilde Cluster  <break time='200ms'/>" +
            "Ihre Daten zu Clustern zusammenfassen.",
            "WITH_GRAPH": "Soll eine grafische Repräsentation erzeugt werden?",
            "DONE": "Ihre Auswertung können Sie im Browser einsehen. Möchten Sie eine weitere Analyse durchführen?",
            "CHOOSE_COLUMN": "Welche Spalte soll wie aggregiert werden?",
            "CHOOSE_COLUMN_REPEAT": "Sagen sie beispielsweise Summe Alter",
            "HELP_AGGREGATION": "Gültige Eingaben folgen dem Muster <break time='200ms'/> Aggregation <break time='100ms'/> " +
            "Funktion <break time='100ms'/> Spalte <break time='500ms'/>" +
            "Erlaubte Funktionen sind Summe, Durchschnitt, Anzahl, Minimum und Maximum. <break time='200ms'/> Beispielsweise " +
            "Aggregation Summe Umsatz <break time='200ms'/> bildet bei den gewählten Gruppen die Summe der Spalte Umsatz"
        }
    }
};
exports.language = languageString;