git clone https://github.com/sudeepkhandekar99/supercells_dev.git

cd jubliee_supercell

cd frontend

npm install 

cd ..

cd backend

python -m venv venv

source venv/bin/activate

pip3 install -r requirements.txt

cd ..

# manual work:

# - terminal 1
# cd jubliee_supercell/backend
# uvicorn main:app --reload

# - terminal 2
# First create .env.local
# cd jubliee_supercell/frontend
# npm run dev
