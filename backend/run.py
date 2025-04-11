import subprocess
import sys
import os
import uvicorn

def install_requirements():
    print("Installation des dépendances...")
    
    # Mise à jour de pip
    try:
        print("Mise à jour de pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "--upgrade", "pip"])
    except subprocess.CalledProcessError as e:
        print(f"Attention : Impossible de mettre à jour pip : {e}")
        print("Tentative de continuation...")

    # Installation des dépendances une par une
    with open("requirements.txt", "r") as f:
        requirements = f.readlines()
    
    for req in requirements:
        req = req.strip()
        if req and not req.startswith("#"):
            print(f"Installation de {req}...")
            try:
                # Installation avec --user pour éviter les problèmes de permissions
                if req.startswith("pandas=="):
                    # Installation de pandas à partir d'une version précompilée
                    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "--only-binary=:all:", req])
                else:
                    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", req])
                print(f"{req} installé avec succès !")
            except subprocess.CalledProcessError as e:
                print(f"Erreur lors de l'installation de {req} : {e}")
                print("Tentative de continuation...")

    print("Vérification des dépendances installées...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "check"])
        print("Toutes les dépendances sont correctement installées !")
    except subprocess.CalledProcessError as e:
        print(f"Attention : Certaines dépendances pourraient ne pas être correctement installées : {e}")
        print("Tentative de lancement du serveur malgré tout...")

if __name__ == "__main__":
    # S'assurer que nous sommes dans le bon répertoire
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Ajouter le dossier Scripts de Python au PATH
    python_scripts = os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "Python", f"Python{sys.version_info.major}{sys.version_info.minor}", "Scripts")
    if python_scripts not in os.environ["PATH"]:
        os.environ["PATH"] = python_scripts + os.pathsep + os.environ["PATH"]
    
    install_requirements()
    print("Lancement du serveur...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 