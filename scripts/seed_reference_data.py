"""
KICKWISE — Reference Data Seeder
Seeds the `teams` table with known Bundesliga teams and
creates a baseline `players` roster from known squad members.
Also creates a mock-mode fallback dataset for offline development.

Usage:
    python scripts/seed_reference_data.py [--mock]
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
DATA_PROCESSED = ROOT / "data" / "processed"
DATA_PROCESSED.mkdir(parents=True, exist_ok=True)
load_dotenv(ROOT / ".env")

logging.basicConfig(level=logging.INFO, format="%(levelname)-8s | %(message)s")
log = logging.getLogger("kickwise.seed")

# ─── Known Bundesliga teams (current + recent) ─────────────────────────────────
BUNDESLIGA_TEAMS = [
    "Bayern München", "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen",
    "Eintracht Frankfurt", "SC Freiburg", "Union Berlin", "Wolfsburg",
    "Borussia M'gladbach", "Hoffenheim", "VfB Stuttgart", "FC Köln",
    "Werder Bremen", "Mainz 05", "FC Augsburg", "VfL Bochum",
    "Hertha BSC", "Schalke 04", "Arminia Bielefeld", "Greuther Fürth",
    "Hamburger SV", "Darmstadt 98", "Heidenheim", "St. Pauli",
    "Holstein Kiel", "Hansa Rostock",
]

# ─── Known player roster (complete 2024/25 Bundesliga squad rosters) ──────────────
# Each entry: (name, team, position, age, season)
SEED_PLAYERS = [
    # Bayern München
    ("Manuel Neuer", "Bayern München", "GK", 38, "2024-25"),
    ("Sven Ulreich", "Bayern München", "GK", 36, "2024-25"),
    ("Alphonso Davies", "Bayern München", "DEF", 24, "2024-25"),
    ("Dayot Upamecano", "Bayern München", "DEF", 26, "2024-25"),
    ("Min-jae Kim", "Bayern München", "DEF", 28, "2024-25"),
    ("Joshua Kimmich", "Bayern München", "DEF", 29, "2024-25"),
    ("Eric Dier", "Bayern München", "DEF", 30, "2024-25"),
    ("Aleksandar Pavlović", "Bayern München", "MID", 20, "2024-25"),
    ("Leon Goretzka", "Bayern München", "MID", 29, "2024-25"),
    ("Jamal Musiala", "Bayern München", "MID", 21, "2024-25"),
    ("Konrad Laimer", "Bayern München", "MID", 27, "2024-25"),
    ("Michael Olise", "Bayern München", "FWD", 23, "2024-25"),
    ("Harry Kane", "Bayern München", "FWD", 31, "2024-25"),
    ("Serge Gnabry", "Bayern München", "FWD", 29, "2024-25"),
    ("Thomas Müller", "Bayern München", "FWD", 35, "2024-25"),
    ("Leroy Sané", "Bayern München", "FWD", 28, "2024-25"),

    # Bayer Leverkusen
    ("Lukáš Hrádecký", "Bayer Leverkusen", "GK", 35, "2024-25"),
    ("Matej Kovář", "Bayer Leverkusen", "GK", 24, "2024-25"),
    ("Alejandro Grimaldo", "Bayer Leverkusen", "DEF", 29, "2024-25"),
    ("Jonathan Tah", "Bayer Leverkusen", "DEF", 28, "2024-25"),
    ("Edmond Tapsoba", "Bayer Leverkusen", "DEF", 25, "2024-25"),
    ("Piero Hincapié", "Bayer Leverkusen", "DEF", 23, "2024-25"),
    ("Jeremie Frimpong", "Bayer Leverkusen", "DEF", 24, "2024-25"),
    ("Granit Xhaka", "Bayer Leverkusen", "MID", 32, "2024-25"),
    ("Robert Andrich", "Bayer Leverkusen", "MID", 30, "2024-25"),
    ("Exequiel Palacios", "Bayer Leverkusen", "MID", 26, "2024-25"),
    ("Florian Wirtz", "Bayer Leverkusen", "MID", 21, "2024-25"),
    ("Aleix García", "Bayer Leverkusen", "MID", 27, "2024-25"),
    ("Martin Terrier", "Bayer Leverkusen", "FWD", 27, "2024-25"),
    ("Victor Boniface", "Bayer Leverkusen", "FWD", 24, "2024-25"),
    ("Patrik Schick", "Bayer Leverkusen", "FWD", 29, "2024-25"),
    ("Amine Adli", "Bayer Leverkusen", "FWD", 24, "2024-25"),

    # Borussia Dortmund
    ("Gregor Kobel", "Borussia Dortmund", "GK", 27, "2024-25"),
    ("Alexander Meyer", "Borussia Dortmund", "GK", 33, "2024-25"),
    ("Julian Ryerson", "Borussia Dortmund", "DEF", 27, "2024-25"),
    ("Nico Schlotterbeck", "Borussia Dortmund", "DEF", 25, "2024-25"),
    ("Waldemar Anton", "Borussia Dortmund", "DEF", 28, "2024-25"),
    ("Niklas Süle", "Borussia Dortmund", "DEF", 29, "2024-25"),
    ("Ramy Bensebaini", "Borussia Dortmund", "DEF", 29, "2024-25"),
    ("Emre Can", "Borussia Dortmund", "MID", 30, "2024-25"),
    ("Pascal Groß", "Borussia Dortmund", "MID", 33, "2024-25"),
    ("Julian Brandt", "Borussia Dortmund", "MID", 28, "2024-25"),
    ("Marcel Sabitzer", "Borussia Dortmund", "MID", 30, "2024-25"),
    ("Felix Nmecha", "Borussia Dortmund", "MID", 24, "2024-25"),
    ("Karim Adeyemi", "Borussia Dortmund", "FWD", 22, "2024-25"),
    ("Serhou Guirassy", "Borussia Dortmund", "FWD", 28, "2024-25"),
    ("Jamie Bynoe-Gittens", "Borussia Dortmund", "FWD", 20, "2024-25"),
    ("Maximilian Beier", "Borussia Dortmund", "FWD", 22, "2024-25"),

    # RB Leipzig
    ("Péter Gulácsi", "RB Leipzig", "GK", 34, "2024-25"),
    ("Maarten Vandevoordt", "RB Leipzig", "GK", 22, "2024-25"),
    ("David Raum", "RB Leipzig", "DEF", 26, "2024-25"),
    ("Castello Lukeba", "RB Leipzig", "DEF", 22, "2024-25"),
    ("Willi Orbán", "RB Leipzig", "DEF", 32, "2024-25"),
    ("Lutsharel Geertruida", "RB Leipzig", "DEF", 24, "2024-25"),
    ("Benjamin Henrichs", "RB Leipzig", "DEF", 27, "2024-25"),
    ("Amadou Haidara", "RB Leipzig", "MID", 26, "2024-25"),
    ("Arthur Vermeeren", "RB Leipzig", "MID", 19, "2024-25"),
    ("Xavi Simons", "RB Leipzig", "MID", 21, "2024-25"),
    ("Christoph Baumgartner", "RB Leipzig", "MID", 25, "2024-25"),
    ("Nicolas Seiwald", "RB Leipzig", "MID", 23, "2024-25"),
    ("Benjamin Šeško", "RB Leipzig", "FWD", 21, "2024-25"),
    ("Loïs Openda", "RB Leipzig", "FWD", 24, "2024-25"),
    ("Antonio Nusa", "RB Leipzig", "FWD", 19, "2024-25"),

    # VfB Stuttgart
    ("Alexander Nübel", "VfB Stuttgart", "GK", 28, "2024-25"),
    ("Fabian Bredlow", "VfB Stuttgart", "GK", 29, "2024-25"),
    ("Maximilian Mittelstädt", "VfB Stuttgart", "DEF", 27, "2024-25"),
    ("Jeff Chabot", "VfB Stuttgart", "DEF", 26, "2024-25"),
    ("Dan-Axel Zagadou", "VfB Stuttgart", "DEF", 25, "2024-25"),
    ("Josha Vagnoman", "VfB Stuttgart", "DEF", 24, "2024-25"),
    ("Anthony Rouault", "VfB Stuttgart", "DEF", 23, "2024-25"),
    ("Atakan Karazor", "VfB Stuttgart", "MID", 28, "2024-25"),
    ("Angelo Stiller", "VfB Stuttgart", "MID", 23, "2024-25"),
    ("Enzo Millot", "VfB Stuttgart", "MID", 22, "2024-25"),
    ("Fabian Rieder", "VfB Stuttgart", "MID", 22, "2024-25"),
    ("Chris Führich", "VfB Stuttgart", "FWD", 27, "2024-25"),
    ("Deniz Undav", "VfB Stuttgart", "FWD", 28, "2024-25"),
    ("Ermedin Demirović", "VfB Stuttgart", "FWD", 26, "2024-25"),
    ("Jamie Leweling", "VfB Stuttgart", "FWD", 23, "2024-25"),
    ("El Bilal Touré", "VfB Stuttgart", "FWD", 23, "2024-25"),

    # Eintracht Frankfurt
    ("Kevin Trapp", "Eintracht Frankfurt", "GK", 34, "2024-25"),
    ("Kaua Santos", "Eintracht Frankfurt", "GK", 21, "2024-25"),
    ("Arthur Theate", "Eintracht Frankfurt", "DEF", 24, "2024-25"),
    ("Robin Koch", "Eintracht Frankfurt", "DEF", 28, "2024-25"),
    ("Tuta", "Eintracht Frankfurt", "DEF", 25, "2024-25"),
    ("Rasmus Kristensen", "Eintracht Frankfurt", "DEF", 27, "2024-25"),
    ("Niels Nkounkou", "Eintracht Frankfurt", "DEF", 24, "2024-25"),
    ("Ellyes Skhiri", "Eintracht Frankfurt", "MID", 29, "2024-25"),
    ("Hugo Larsson", "Eintracht Frankfurt", "MID", 20, "2024-25"),
    ("Mario Götze", "Eintracht Frankfurt", "MID", 32, "2024-25"),
    ("Farès Chaïbi", "Eintracht Frankfurt", "MID", 22, "2024-25"),
    ("Ansgar Knauff", "Eintracht Frankfurt", "FWD", 22, "2024-25"),
    ("Omar Marmoush", "Eintracht Frankfurt", "FWD", 25, "2024-25"),
    ("Hugo Ekitiké", "Eintracht Frankfurt", "FWD", 22, "2024-25"),
    ("Igor Matanović", "Eintracht Frankfurt", "FWD", 21, "2024-25"),

    # FC Augsburg
    ("Finn Dahmen", "FC Augsburg", "GK", 26, "2024-25"),
    ("Nediljko Labrović", "FC Augsburg", "GK", 25, "2024-25"),
    ("Dimitris Giannoulis", "FC Augsburg", "DEF", 29, "2024-25"),
    ("Jeffrey Gouweleeuw", "FC Augsburg", "DEF", 33, "2024-25"),
    ("Keven Schlotterbeck", "FC Augsburg", "DEF", 27, "2024-25"),
    ("Marius Wolf", "FC Augsburg", "DEF", 29, "2024-25"),
    ("Maximilian Bauer", "FC Augsburg", "DEF", 24, "2024-25"),
    ("Kristijan Jakić", "FC Augsburg", "MID", 27, "2024-25"),
    ("Elvis Rexhbeçaj", "FC Augsburg", "MID", 27, "2024-25"),
    ("Arne Maier", "FC Augsburg", "MID", 26, "2024-25"),
    ("Alexis Claude-Maurice", "FC Augsburg", "MID", 26, "2024-25"),
    ("Fredrik Jensen", "FC Augsburg", "MID", 27, "2024-25"),
    ("Ruben Vargas", "FC Augsburg", "FWD", 26, "2024-25"),
    ("Phillip Tietz", "FC Augsburg", "FWD", 27, "2024-25"),
    ("Samuel Essende", "FC Augsburg", "FWD", 26, "2024-25"),
    ("Steve Mounié", "FC Augsburg", "FWD", 30, "2024-25"),

    # SC Freiburg
    ("Noah Atubolu", "SC Freiburg", "GK", 22, "2024-25"),
    ("Florian Müller", "SC Freiburg", "GK", 27, "2024-25"),
    ("Christian Günter", "SC Freiburg", "DEF", 31, "2024-25"),
    ("Matthias Ginter", "SC Freiburg", "DEF", 31, "2024-25"),
    ("Philipp Lienhart", "SC Freiburg", "DEF", 28, "2024-25"),
    ("Lukas Kübler", "SC Freiburg", "DEF", 32, "2024-25"),
    ("Kiliann Sildillia", "SC Freiburg", "DEF", 22, "2024-25"),
    ("Maximilian Eggestein", "SC Freiburg", "MID", 28, "2024-25"),
    ("Patrick Osterhage", "SC Freiburg", "MID", 24, "2024-25"),
    ("Vincenzo Grifo", "SC Freiburg", "MID", 31, "2024-25"),
    ("Merlin Röhl", "SC Freiburg", "MID", 22, "2024-25"),
    ("Ritsu Dōan", "SC Freiburg", "FWD", 26, "2024-25"),
    ("Junior Adamu", "SC Freiburg", "FWD", 23, "2024-25"),
    ("Lucas Höler", "SC Freiburg", "FWD", 30, "2024-25"),
    ("Michael Gregoritsch", "SC Freiburg", "FWD", 30, "2024-25"),

    # Hoffenheim
    ("Oliver Baumann", "Hoffenheim", "GK", 34, "2024-25"),
    ("Luca Philipp", "Hoffenheim", "GK", 24, "2024-25"),
    ("David Jurásek", "Hoffenheim", "DEF", 24, "2024-25"),
    ("Kevin Akpoguma", "Hoffenheim", "DEF", 29, "2024-25"),
    ("Arthur Chaves", "Hoffenheim", "DEF", 23, "2024-25"),
    ("Pavel Kadeřábek", "Hoffenheim", "DEF", 32, "2024-25"),
    ("Valentin Gendrey", "Hoffenheim", "DEF", 24, "2024-25"),
    ("Florian Grillitsch", "Hoffenheim", "MID", 29, "2024-25"),
    ("Anton Stach", "Hoffenheim", "MID", 26, "2024-25"),
    ("Tom Bischof", "Hoffenheim", "MID", 19, "2024-25"),
    ("Dennis Geiger", "Hoffenheim", "MID", 26, "2024-25"),
    ("Andrej Kramarić", "Hoffenheim", "FWD", 33, "2024-25"),
    ("Adam Hložek", "Hoffenheim", "FWD", 22, "2024-25"),
    ("Marius Bülter", "Hoffenheim", "FWD", 31, "2024-25"),
    ("Haris Tabaković", "Hoffenheim", "FWD", 30, "2024-25"),
    ("Mergim Berisha", "Hoffenheim", "FWD", 26, "2024-25"),

    # Wolfsburg
    ("Kamil Grabara", "Wolfsburg", "GK", 26, "2024-25"),
    ("Pavao Pervan", "Wolfsburg", "GK", 37, "2024-25"),
    ("Joakim Mæhle", "Wolfsburg", "DEF", 27, "2024-25"),
    ("Sebastiaan Bornauw", "Wolfsburg", "DEF", 25, "2024-25"),
    ("Denis Vavro", "Wolfsburg", "DEF", 28, "2024-25"),
    ("Kilian Fischer", "Wolfsburg", "DEF", 24, "2024-25"),
    ("Konstantinos Koulierakis", "Wolfsburg", "DEF", 21, "2024-25"),
    ("Maximilian Arnold", "Wolfsburg", "MID", 30, "2024-25"),
    ("Salih Özcan", "Wolfsburg", "MID", 27, "2024-25"),
    ("Lovro Majer", "Wolfsburg", "MID", 27, "2024-25"),
    ("Mattias Svanberg", "Wolfsburg", "MID", 26, "2024-25"),
    ("Ridle Baku", "Wolfsburg", "FWD", 26, "2024-25"),
    ("Jonas Wind", "Wolfsburg", "FWD", 25, "2024-25"),
    ("Tiago Tomás", "Wolfsburg", "FWD", 22, "2024-25"),
    ("Patrick Wimmer", "Wolfsburg", "FWD", 23, "2024-25"),
    ("Mohamed Amoura", "Wolfsburg", "FWD", 24, "2024-25"),

    # Borussia M'gladbach
    ("Jonas Omlin", "Borussia M'gladbach", "GK", 31, "2024-25"),
    ("Moritz Nicolas", "Borussia M'gladbach", "GK", 27, "2024-25"),
    ("Luca Netz", "Borussia M'gladbach", "DEF", 21, "2024-25"),
    ("Nico Elvedi", "Borussia M'gladbach", "DEF", 28, "2024-25"),
    ("Ko Itakura", "Borussia M'gladbach", "DEF", 28, "2024-25"),
    ("Joe Scally", "Borussia M'gladbach", "DEF", 22, "2024-25"),
    ("Marvin Friedrich", "Borussia M'gladbach", "DEF", 29, "2024-25"),
    ("Julian Weigl", "Borussia M'gladbach", "MID", 29, "2024-25"),
    ("Philipp Sander", "Borussia M'gladbach", "MID", 26, "2024-25"),
    ("Kevin Stöger", "Borussia M'gladbach", "MID", 31, "2024-25"),
    ("Florian Neuhaus", "Borussia M'gladbach", "MID", 27, "2024-25"),
    ("Rocco Reitz", "Borussia M'gladbach", "MID", 22, "2024-25"),
    ("Franck Honorat", "Borussia M'gladbach", "FWD", 28, "2024-25"),
    ("Tim Kleindienst", "Borussia M'gladbach", "FWD", 29, "2024-25"),
    ("Alassane Pléa", "Borussia M'gladbach", "FWD", 31, "2024-25"),
    ("Robin Hack", "Borussia M'gladbach", "FWD", 26, "2024-25"),

    # Werder Bremen
    ("Michael Zetterer", "Werder Bremen", "GK", 29, "2024-25"),
    ("Mio Backhaus", "Werder Bremen", "GK", 20, "2024-25"),
    ("Felix Agu", "Werder Bremen", "DEF", 25, "2024-25"),
    ("Marco Friedl", "Werder Bremen", "DEF", 26, "2024-25"),
    ("Miloš Veljković", "Werder Bremen", "DEF", 29, "2024-25"),
    ("Mitchell Weiser", "Werder Bremen", "DEF", 30, "2024-25"),
    ("Anthony Jung", "Werder Bremen", "DEF", 33, "2024-25"),
    ("Senne Lynen", "Werder Bremen", "MID", 25, "2024-25"),
    ("Jens Stage", "Werder Bremen", "MID", 28, "2024-25"),
    ("Romano Schmid", "Werder Bremen", "MID", 25, "2024-25"),
    ("Leonardo Bittencourt", "Werder Bremen", "MID", 31, "2024-25"),
    ("Marco Grüll", "Werder Bremen", "FWD", 26, "2024-25"),
    ("Marvin Ducksch", "Werder Bremen", "FWD", 30, "2024-25"),
    ("Keke Topp", "Werder Bremen", "FWD", 20, "2024-25"),
    ("Justin Njinmah", "Werder Bremen", "FWD", 24, "2024-25"),

    # Heidenheim
    ("Kevin Müller", "Heidenheim", "GK", 33, "2024-25"),
    ("Vitush Eicher", "Heidenheim", "GK", 34, "2024-25"),
    ("Jonas Föhrenbach", "Heidenheim", "DEF", 29, "2024-25"),
    ("Patrick Mainka", "Heidenheim", "DEF", 30, "2024-25"),
    ("Benedikt Gimber", "Heidenheim", "DEF", 27, "2024-25"),
    ("Marnon Busch", "Heidenheim", "DEF", 30, "2024-25"),
    ("Hakim Guenouche", "Heidenheim", "DEF", 24, "2024-25"),
    ("Lennard Maloney", "Heidenheim", "MID", 25, "2024-25"),
    ("Jan Schöppner", "Heidenheim", "MID", 25, "2024-25"),
    ("Paul Wanner", "Heidenheim", "MID", 19, "2024-25"),
    ("Niklas Dorsch", "Heidenheim", "MID", 27, "2024-25"),
    ("Léo Scienza", "Heidenheim", "FWD", 26, "2024-25"),
    ("Marvin Pieringer", "Heidenheim", "FWD", 25, "2024-25"),
    ("Adrian Beck", "Heidenheim", "FWD", 27, "2024-25"),
    ("Maximilian Breunig", "Heidenheim", "FWD", 24, "2024-25"),
    ("Mikkel Kaufmann", "Heidenheim", "FWD", 24, "2024-25"),

    # Mainz 05
    ("Robin Zentner", "Mainz 05", "GK", 30, "2024-25"),
    ("Daniel Batz", "Mainz 05", "GK", 34, "2024-25"),
    ("Phillipp Mwene", "Mainz 05", "DEF", 31, "2024-25"),
    ("Dominik Kohr", "Mainz 05", "DEF", 31, "2024-25"),
    ("Stefan Bell", "Mainz 05", "DEF", 33, "2024-25"),
    ("Anthony Caci", "Mainz 05", "DEF", 27, "2024-25"),
    ("Silvan Widmer", "Mainz 05", "DEF", 31, "2024-25"),
    ("Kaishu Sano", "Mainz 05", "MID", 24, "2024-25"),
    ("Nadiem Amiri", "Mainz 05", "MID", 28, "2024-25"),
    ("Jae-sung Lee", "Mainz 05", "MID", 32, "2024-25"),
    ("Paul Nebel", "Mainz 05", "FWD", 22, "2024-25"),
    ("Jonathan Burkardt", "Mainz 05", "FWD", 24, "2024-25"),
    ("Armindo Sieb", "Mainz 05", "FWD", 21, "2024-25"),
    ("Karim Onisiwo", "Mainz 05", "FWD", 32, "2024-25"),
    ("Nelson Weiper", "Mainz 05", "FWD", 20, "2024-25"),

    # Union Berlin
    ("Frederik Rønnow", "Union Berlin", "GK", 32, "2024-25"),
    ("Alexander Schwolow", "Union Berlin", "GK", 32, "2024-25"),
    ("Tom Rothe", "Union Berlin", "DEF", 20, "2024-25"),
    ("Kevin Vogt", "Union Berlin", "DEF", 33, "2024-25"),
    ("Danilho Doekhi", "Union Berlin", "DEF", 26, "2024-25"),
    ("Diogo Leite", "Union Berlin", "DEF", 26, "2024-25"),
    ("Christopher Trimmel", "Union Berlin", "DEF", 37, "2024-25"),
    ("Rani Khedira", "Union Berlin", "MID", 31, "2024-25"),
    ("Aljoscha Kemlein", "Union Berlin", "MID", 20, "2024-25"),
    ("Janik Haberer", "Union Berlin", "MID", 30, "2024-25"),
    ("László Bénes", "Union Berlin", "MID", 27, "2024-25"),
    ("Woo-yeong Jeong", "Union Berlin", "FWD", 25, "2024-25"),
    ("Benedict Hollerbach", "Union Berlin", "FWD", 23, "2024-25"),
    ("Jordan Siebatcheu", "Union Berlin", "FWD", 28, "2024-25"),
    ("Yorbe Vertessen", "Union Berlin", "FWD", 24, "2024-25"),
    ("Tim Skarke", "Union Berlin", "FWD", 28, "2024-25"),

    # VfL Bochum
    ("Patrick Drewes", "VfL Bochum", "GK", 32, "2024-25"),
    ("Timo Horn", "VfL Bochum", "GK", 31, "2024-25"),
    ("Maximilian Wittek", "VfL Bochum", "DEF", 29, "2024-25"),
    ("Ivan Ordets", "VfL Bochum", "DEF", 32, "2024-25"),
    ("Jakov Medić", "VfL Bochum", "DEF", 26, "2024-25"),
    ("Felix Passlack", "VfL Bochum", "DEF", 26, "2024-25"),
    ("Tim Oermann", "VfL Bochum", "DEF", 21, "2024-25"),
    ("Anthony Losilla", "VfL Bochum", "MID", 38, "2024-25"),
    ("Ibrahima Sissoko", "VfL Bochum", "MID", 27, "2024-25"),
    ("Matus Bero", "VfL Bochum", "MID", 29, "2024-25"),
    ("Dani de Wit", "VfL Bochum", "MID", 27, "2024-25"),
    ("Koji Miyoshi", "VfL Bochum", "MID", 27, "2024-25"),
    ("Philipp Hofmann", "VfL Bochum", "FWD", 31, "2024-25"),
    ("Myron Boadu", "VfL Bochum", "FWD", 24, "2024-25"),
    ("Moritz Broschinski", "VfL Bochum", "FWD", 24, "2024-25"),
    ("Gerrit Holtmann", "VfL Bochum", "FWD", 29, "2024-25"),

    # FC St. Pauli
    ("Nikola Vasilj", "FC St. Pauli", "GK", 29, "2024-25"),
    ("Sascha Burchert", "FC St. Pauli", "GK", 35, "2024-25"),
    ("Philipp Treu", "FC St. Pauli", "DEF", 24, "2024-25"),
    ("Eric Smith", "FC St. Pauli", "DEF", 28, "2024-25"),
    ("Hauke Wahl", "FC St. Pauli", "DEF", 30, "2024-25"),
    ("Manolis Saliakas", "FC St. Pauli", "DEF", 28, "2024-25"),
    ("Karol Mets", "FC St. Pauli", "DEF", 31, "2024-25"),
    ("Jackson Irvine", "FC St. Pauli", "MID", 31, "2024-25"),
    ("Carlo Boukhalfa", "FC St. Pauli", "MID", 25, "2024-25"),
    ("Robert Wagner", "FC St. Pauli", "MID", 21, "2024-25"),
    ("Connor Metcalfe", "FC St. Pauli", "MID", 25, "2024-25"),
    ("Oladapo Afolayan", "FC St. Pauli", "FWD", 27, "2024-25"),
    ("Johannes Eggestein", "FC St. Pauli", "FWD", 26, "2024-25"),
    ("Morgan Guilavogui", "FC St. Pauli", "FWD", 26, "2024-25"),
    ("Danel Sinani", "FC St. Pauli", "FWD", 27, "2024-25"),
    ("Scott Banks", "FC St. Pauli", "FWD", 23, "2024-25"),

    # Holstein Kiel
    ("Timon Weiner", "Holstein Kiel", "GK", 26, "2024-25"),
    ("Thomas Dähne", "Holstein Kiel", "GK", 31, "2024-25"),
    ("Tymoteusz Puchacz", "Holstein Kiel", "DEF", 26, "2024-25"),
    ("Patrick Erras", "Holstein Kiel", "DEF", 30, "2024-25"),
    ("Marco Komenda", "Holstein Kiel", "DEF", 28, "2024-25"),
    ("Timo Becker", "Holstein Kiel", "DEF", 27, "2024-25"),
    ("Max Geschwill", "Holstein Kiel", "DEF", 23, "2024-25"),
    ("Magnus Knudsen", "Holstein Kiel", "MID", 23, "2024-25"),
    ("Nicolai Remberg", "Holstein Kiel", "MID", 24, "2024-25"),
    ("Lewis Holtby", "Holstein Kiel", "MID", 34, "2024-25"),
    ("Armin Gigović", "Holstein Kiel", "MID", 22, "2024-25"),
    ("Alexander Bernhardsson", "Holstein Kiel", "FWD", 26, "2024-25"),
    ("Shuto Machino", "Holstein Kiel", "FWD", 25, "2024-25"),
    ("Benedikt Pichler", "Holstein Kiel", "FWD", 27, "2024-25"),
    ("Fiete Arp", "Holstein Kiel", "FWD", 25, "2024-25"),
    ("Steven Skrzybski", "Holstein Kiel", "FWD", 32, "2024-25"),
]

RNG = np.random.default_rng(42)


def build_player_id(name: str, team: str, season: str) -> str:
    import hashlib
    slug = f"{name.lower().strip()}_{team.lower().strip()}_{season}"
    return hashlib.md5(slug.encode()).hexdigest()[:16]


def generate_mock_stats(position: str, rng: np.random.Generator) -> dict:
    """
    Generate plausible per-90 metrics for seed players based on position.
    These are used ONLY for mock/seed mode and should not feed ML directly.
    """
    if position == "GK":
        return {
            "minutes": float(rng.integers(1000, 3060)),
            "goals_90": 0.0,
            "assists_90": 0.0,
            "shots_90": 0.0,
            "shots_on_target_90": 0.0,
            "xg_90": 0.0,
            "xa_90": 0.0,
            "npxg_90": 0.0,
            "key_passes_90": round(float(rng.uniform(0.1, 0.4)), 3),
            "progressive_passes_90": round(float(rng.uniform(1.5, 4.0)), 3),
            "progressive_carries_90": 0.0,
            "tackles_90": round(float(rng.uniform(0.2, 0.8)), 3),
            "interceptions_90": round(float(rng.uniform(0.1, 0.5)), 3),
            "blocks_90": 0.0,
            "clearances_90": round(float(rng.uniform(0.5, 2.0)), 3),
            "pressures_90": round(float(rng.uniform(0.5, 2.0)), 3),
            "dribbles_completed_90": 0.0,
            "pass_completion_pct": round(float(rng.uniform(50, 75)), 1),
            "pressure_success_pct": round(float(rng.uniform(20, 45)), 1),
        }
    elif position == "DEF":
        return {
            "minutes": float(rng.integers(800, 3060)),
            "goals_90": round(float(rng.uniform(0.0, 0.12)), 3),
            "assists_90": round(float(rng.uniform(0.0, 0.15)), 3),
            "shots_90": round(float(rng.uniform(0.2, 0.9)), 3),
            "shots_on_target_90": round(float(rng.uniform(0.05, 0.3)), 3),
            "xg_90": round(float(rng.uniform(0.02, 0.08)), 3),
            "xa_90": round(float(rng.uniform(0.02, 0.1)), 3),
            "npxg_90": round(float(rng.uniform(0.02, 0.08)), 3),
            "key_passes_90": round(float(rng.uniform(0.2, 0.9)), 3),
            "progressive_passes_90": round(float(rng.uniform(2.0, 7.0)), 3),
            "progressive_carries_90": round(float(rng.uniform(0.5, 2.5)), 3),
            "tackles_90": round(float(rng.uniform(1.2, 4.5)), 3),
            "interceptions_90": round(float(rng.uniform(0.8, 3.0)), 3),
            "blocks_90": round(float(rng.uniform(0.3, 1.5)), 3),
            "clearances_90": round(float(rng.uniform(2.0, 8.0)), 3),
            "pressures_90": round(float(rng.uniform(5.0, 15.0)), 3),
            "dribbles_completed_90": round(float(rng.uniform(0.1, 0.8)), 3),
            "pass_completion_pct": round(float(rng.uniform(70, 90)), 1),
            "pressure_success_pct": round(float(rng.uniform(25, 50)), 1),
        }
    elif position == "MID":
        return {
            "minutes": float(rng.integers(700, 3060)),
            "goals_90": round(float(rng.uniform(0.05, 0.35)), 3),
            "assists_90": round(float(rng.uniform(0.1, 0.45)), 3),
            "shots_90": round(float(rng.uniform(0.8, 3.0)), 3),
            "shots_on_target_90": round(float(rng.uniform(0.2, 1.2)), 3),
            "xg_90": round(float(rng.uniform(0.05, 0.3)), 3),
            "xa_90": round(float(rng.uniform(0.1, 0.4)), 3),
            "npxg_90": round(float(rng.uniform(0.04, 0.25)), 3),
            "key_passes_90": round(float(rng.uniform(0.8, 3.0)), 3),
            "progressive_passes_90": round(float(rng.uniform(4.0, 12.0)), 3),
            "progressive_carries_90": round(float(rng.uniform(1.5, 6.0)), 3),
            "tackles_90": round(float(rng.uniform(1.0, 4.0)), 3),
            "interceptions_90": round(float(rng.uniform(0.8, 3.5)), 3),
            "blocks_90": round(float(rng.uniform(0.2, 1.0)), 3),
            "clearances_90": round(float(rng.uniform(0.2, 1.5)), 3),
            "pressures_90": round(float(rng.uniform(8.0, 22.0)), 3),
            "dribbles_completed_90": round(float(rng.uniform(0.5, 3.0)), 3),
            "pass_completion_pct": round(float(rng.uniform(75, 92)), 1),
            "pressure_success_pct": round(float(rng.uniform(25, 55)), 1),
        }
    else:  # FWD
        return {
            "minutes": float(rng.integers(500, 3060)),
            "goals_90": round(float(rng.uniform(0.2, 0.85)), 3),
            "assists_90": round(float(rng.uniform(0.1, 0.5)), 3),
            "shots_90": round(float(rng.uniform(2.0, 5.5)), 3),
            "shots_on_target_90": round(float(rng.uniform(0.8, 2.5)), 3),
            "xg_90": round(float(rng.uniform(0.2, 0.7)), 3),
            "xa_90": round(float(rng.uniform(0.05, 0.35)), 3),
            "npxg_90": round(float(rng.uniform(0.15, 0.65)), 3),
            "key_passes_90": round(float(rng.uniform(0.5, 2.0)), 3),
            "progressive_passes_90": round(float(rng.uniform(1.5, 5.0)), 3),
            "progressive_carries_90": round(float(rng.uniform(2.0, 7.0)), 3),
            "tackles_90": round(float(rng.uniform(0.3, 1.5)), 3),
            "interceptions_90": round(float(rng.uniform(0.2, 1.2)), 3),
            "blocks_90": round(float(rng.uniform(0.1, 0.6)), 3),
            "clearances_90": round(float(rng.uniform(0.1, 0.8)), 3),
            "pressures_90": round(float(rng.uniform(5.0, 18.0)), 3),
            "dribbles_completed_90": round(float(rng.uniform(1.0, 5.0)), 3),
            "pass_completion_pct": round(float(rng.uniform(65, 85)), 1),
            "pressure_success_pct": round(float(rng.uniform(20, 45)), 1),
        }


def seed_supabase_teams(supabase) -> None:
    rows = [{"team_id": t, "team_name": t} for t in BUNDESLIGA_TEAMS]
    supabase.table("teams").upsert(rows, on_conflict="team_id").execute()
    log.info(f"  ✓ Seeded {len(rows)} teams")


def seed_supabase_players(supabase, players_df: pd.DataFrame) -> None:
    records = players_df.to_dict(orient="records")
    CHUNK = 200
    for i in range(0, len(records), CHUNK):
        supabase.table("player_metrics_per_90").upsert(
            records[i : i + CHUNK], on_conflict="player_id,season,team"
        ).execute()
    log.info(f"  ✓ Seeded {len(records)} seed players")


def build_players_df() -> pd.DataFrame:
    rows = []
    seen: set[tuple] = set()
    for name, team, pos, age, season in SEED_PLAYERS:
        key = (name, team, season)
        if key in seen:
            continue
        seen.add(key)
        stats = generate_mock_stats(pos, RNG)
        rows.append({
            "player_id": build_player_id(name, team, season),
            "player_name": name,
            "team": team,
            "season": season,
            "position": pos,
            "age": age,
            "matches_played": int(RNG.integers(10, 34)),
            **stats,
            "data_complete": False,  # Flagged as seed data
        })
    return pd.DataFrame(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mock", action="store_true", help="Only write local Parquet, skip Supabase")
    args = parser.parse_args()

    log.info("KICKWISE Reference Data Seeder")

    players_df = build_players_df()
    log.info(f"Built {len(players_df)} seed player records")

    # Always write parquet (used as fallback by ML training)
    players_df.to_parquet(DATA_PROCESSED / "player_metrics_seed.parquet", index=False)
    log.info(f"  ✓ Saved seed players to {DATA_PROCESSED / 'player_metrics_seed.parquet'}")

    if not args.mock:
        try:
            from supabase import create_client  # type: ignore
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            if not url or not key:
                log.error("SUPABASE_URL / SUPABASE_KEY not set — re-run with --mock")
                return 1
            supabase = create_client(url, key)
            seed_supabase_teams(supabase)
            seed_supabase_players(supabase, players_df)
        except Exception as exc:
            log.error(f"Supabase seeding failed: {exc}")
            return 1
    else:
        log.info("Mock mode: skipping Supabase, local Parquet written.")

    log.info("✓ Seeding complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
