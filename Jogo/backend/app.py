from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import random
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('backend/dados.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/', methods=["GET"])
def root_page():
    return "Online!"

@app.route('/characters/get-hint', methods=['GET'])
def get_hint1():
    conn = get_db_connection()
    hint1 = conn.execute('SELECT hint1, hint2, hint3, nickname FROM characters WHERE name = ?', (random_character, )).fetchall()
    conn.close()
    hints = [{'hint1': row['hint1'], 'hint2': row['hint2'], 'hint3': row['hint3'], 'nickname': row['nickname']} for row in hint1]
    return jsonify(hints)

@app.route('/characters', methods=['GET'])
def get_characters():
    conn = get_db_connection()
    characters = conn.execute('SELECT name FROM characters').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in characters])

@app.route('/randomCharacter', methods=['GET'])
def create_random_character():
    conn = get_db_connection()
    characters = conn.execute('SELECT * FROM characters').fetchall()
    conn.close()
    characters_list = [dict(row) for row in characters]
    random_character = random.choice(characters_list)
    
    client_ip = request.remote_addr

    timestamp = datetime.now().isoformat()
    
    return jsonify({
        'ID': random_character['id'],
        'IP': client_ip,
        'random_character': random_character['name'],
        'TIMESTAMP': timestamp
    })

# Função para inicializar o jogo
def initialize_game():
     with app.test_request_context():
         global random_character
         response = create_random_character()
         random_character = response.get_json().get('random_character')

# hora_atual = datetime.now().strftime("%H:%M")

# # # if hora_atual == "10:24": 
initialize_game()

@app.route('/characters/<name>', methods=['GET'])
def get_character(name):
    conn = get_db_connection()
    character = conn.execute('SELECT * FROM characters WHERE name = ?', (name,)).fetchone()
    conn.close()
    if character:
        return jsonify(dict(character))
    else:
        return jsonify({'error': 'Character not found'}), 404

@app.route('/characters/verifyGuess', methods=['POST'])

def verify_guess():
    user_guess = request.json.get('guess')
    response_guess = requests.get(f"http://127.0.0.1:5000/characters/{user_guess}")
    data_guess = response_guess.json()
    response = requests.get(f"http://127.0.0.1:5000/characters/{random_character}")
    data = response.json()

    random_character_age = data.get("age")
    random_character_country = data.get("country")
    random_character_id = data.get("id")
    random_character_name = data.get("name")
    random_character_sex = data.get("sex")
    random_character_sport = data.get("sport")
    random_character_status = data.get("status")
    
    guessed_character_age = data_guess.get("age")
    guessed_character_country = data_guess.get("country")
    guessed_character_id = data_guess.get("id")
    guessed_character_name = data_guess.get("name")
    guessed_character_sex = data_guess.get("sex")
    guessed_character_sport = data_guess.get("sport")
    guessed_character_status = data_guess.get("status")


    if guessed_character_id == random_character_id:
        return jsonify({"result": True, "age": "equal", "age_content": guessed_character_age, "country": True, "country_content": guessed_character_country, "sex": True, "sex_content": guessed_character_sex, "sport": True, "sport_content": guessed_character_sport, "status": True, "status_content": guessed_character_status})
    else:
        if random_character_sex == guessed_character_sex:
            sex = True
        else:
            sex = False

        if guessed_character_sport == random_character_sport:
            sport = True
        else: 
            sport = False

        if guessed_character_status == random_character_status:
            status = True
        else:
            status = False

        if random_character_country == guessed_character_country:
            country = True   
        else:
            country = False

        if random_character_age > guessed_character_age:
            age = "higher"
        elif random_character_age < guessed_character_age:
            age = "lower"
        else:
            age = "equal"

        return jsonify({"result": False, "age": age, "age_content": guessed_character_age, "country": country, "country_content": guessed_character_country, "sex": sex, "sex_content": guessed_character_sex, "sport": sport, "sport_content": guessed_character_sport, "status": status, "status_content": guessed_character_status})

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
