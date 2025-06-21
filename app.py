from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file, flash
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
from datetime import datetime
import PyPDF2
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database initialization
def init_db():
    conn = sqlite3.connect('university_papers.db')
    c = conn.cursor()
    
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Papers table
    c.execute('''
        CREATE TABLE IF NOT EXISTS papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            department TEXT NOT NULL,
            semester INTEGER NOT NULL,
            subject TEXT NOT NULL,
            year INTEGER NOT NULL,
            exam_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            pages INTEGER,
            uploader_id INTEGER,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            description TEXT,
            FOREIGN KEY (uploader_id) REFERENCES users (id)
        )
    ''')
    
    # Ratings table
    c.execute('''
        CREATE TABLE IF NOT EXISTS ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paper_id INTEGER,
            user_id INTEGER,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paper_id) REFERENCES papers (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(paper_id, user_id)
        )
    ''')
    
    # Comments table
    c.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paper_id INTEGER,
            user_id INTEGER,
            comment TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paper_id) REFERENCES papers (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create default admin user
    admin_hash = generate_password_hash('admin123')
    c.execute('INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
              ('admin', 'admin@university.edu', admin_hash, 'admin'))
    
    conn.commit()
    conn.close()

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            flash('Admin access required')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = sqlite3.connect('university_papers.db')
        c = conn.cursor()
        c.execute('SELECT id, username, password_hash, role FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()
        
        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['role'] = user[3]
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid credentials')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        conn = sqlite3.connect('university_papers.db')
        c = conn.cursor()
        
        # Check if user exists
        c.execute('SELECT id FROM users WHERE username = ? OR email = ?', (username, email))
        if c.fetchone():
            flash('Username or email already exists')
            conn.close()
            return render_template('register.html')
        
        # Create new user
        password_hash = generate_password_hash(password)
        c.execute('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                  (username, email, password_hash))
        conn.commit()
        conn.close()
        
        flash('Registration successful! Please login.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/dashboard-stats')
@login_required
def dashboard_stats():
    conn = sqlite3.connect('university_papers.db')
    c = conn.cursor()
    
    # Get total papers
    c.execute('SELECT COUNT(*) FROM papers')
    total_papers = c.fetchone()[0]
    
    # Get total departments
    c.execute('SELECT COUNT(DISTINCT department) FROM papers')
    total_departments = c.fetchone()[0]
    
    # Get user's ratings count
    c.execute('SELECT COUNT(*) FROM ratings WHERE user_id = ?', (session['user_id'],))
    my_ratings = c.fetchone()[0]
    
    # Get user's comments count
    c.execute('SELECT COUNT(*) FROM comments WHERE user_id = ?', (session['user_id'],))
    my_comments = c.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'total_papers': total_papers,
        'total_departments': total_departments,
        'my_ratings': my_ratings,
        'my_comments': my_comments
    })

@app.route('/upload', methods=['GET', 'POST'])
@admin_required
def upload_paper():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)
        
        if file and file.filename.lower().endswith('.pdf'):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
            filename = timestamp + filename
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Get PDF info
            try:
                with open(file_path, 'rb') as pdf_file:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    pages = len(pdf_reader.pages)
            except:
                pages = 0
            
            file_size = os.path.getsize(file_path)
            
            # Save to database
            conn = sqlite3.connect('university_papers.db')
            c = conn.cursor()
            c.execute('''
                INSERT INTO papers (title, department, semester, subject, year, exam_type, 
                                  file_path, file_size, pages, uploader_id, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                request.form['title'],
                request.form['department'],
                int(request.form['semester']),
                request.form['subject'],
                int(request.form['year']),
                request.form['exam_type'],
                filename,
                file_size,
                pages,
                session['user_id'],
                request.form.get('description', '')
            ))
            conn.commit()
            conn.close()
            
            flash('Paper uploaded successfully!')
            return redirect(url_for('dashboard'))
        else:
            flash('Only PDF files are allowed')
    
    return render_template('upload.html')

@app.route('/api/papers')
def api_papers():
    conn = sqlite3.connect('university_papers.db')
    c = conn.cursor()
    
    # Get filter parameters
    department = request.args.get('department')
    semester = request.args.get('semester')
    subject = request.args.get('subject')
    year = request.args.get('year')
    exam_type = request.args.get('exam_type')
    search = request.args.get('search')
    
    query = '''
        SELECT p.*, u.username as uploader_name,
               AVG(r.rating) as avg_rating,
               COUNT(r.rating) as rating_count
        FROM papers p
        LEFT JOIN users u ON p.uploader_id = u.id
        LEFT JOIN ratings r ON p.id = r.paper_id
        WHERE 1=1
    '''
    params = []
    
    if department:
        query += ' AND p.department = ?'
        params.append(department)
    if semester:
        query += ' AND p.semester = ?'
        params.append(int(semester))
    if subject:
        query += ' AND p.subject LIKE ?'
        params.append(f'%{subject}%')
    if year:
        query += ' AND p.year = ?'
        params.append(int(year))
    if exam_type:
        query += ' AND p.exam_type = ?'
        params.append(exam_type)
    if search:
        query += ' AND (p.title LIKE ? OR p.subject LIKE ? OR p.description LIKE ?)'
        search_param = f'%{search}%'
        params.extend([search_param, search_param, search_param])
    
    query += ' GROUP BY p.id ORDER BY p.upload_date DESC'
    
    c.execute(query, params)
    papers = c.fetchall()
    conn.close()
    
    papers_list = []
    for paper in papers:
        papers_list.append({
            'id': paper[0],
            'title': paper[1],
            'department': paper[2],
            'semester': paper[3],
            'subject': paper[4],
            'year': paper[5],
            'exam_type': paper[6],
            'file_path': paper[7],  # Add file_path to the response
            'file_size': paper[8],
            'pages': paper[9],
            'upload_date': paper[11],
            'description': paper[12],
            'uploader_name': paper[13],
            'avg_rating': round(paper[14], 1) if paper[14] else 0,
            'rating_count': paper[15]
        })
    
    return jsonify(papers_list)

@app.route('/api/filters')
def api_filters():
    conn = sqlite3.connect('university_papers.db')
    c = conn.cursor()
    
    # Get unique values for filters
    c.execute('SELECT DISTINCT department FROM papers ORDER BY department')
    departments = [row[0] for row in c.fetchall()]
    
    c.execute('SELECT DISTINCT semester FROM papers ORDER BY semester')
    semesters = [row[0] for row in c.fetchall()]
    
    c.execute('SELECT DISTINCT subject FROM papers ORDER BY subject')
    subjects = [row[0] for row in c.fetchall()]
    
    c.execute('SELECT DISTINCT year FROM papers ORDER BY year DESC')
    years = [row[0] for row in c.fetchall()]
    
    c.execute('SELECT DISTINCT exam_type FROM papers ORDER BY exam_type')
    exam_types = [row[0] for row in c.fetchall()]
    
    conn.close()
    
    return jsonify({
        'departments': departments,
        'semesters': semesters,
        'subjects': subjects,
        'years': years,
        'exam_types': exam_types
    })

@app.route('/api/papers/<int:paper_id>')
def get_paper(paper_id):
    conn = sqlite3.connect('university_papers.db')
    c = conn.cursor()
    
    query = '''
        SELECT p.*, u.username as uploader_name,
               AVG(r.rating) as avg_rating,
               COUNT(r.rating) as rating_count
        FROM papers p
        LEFT JOIN users u ON p.uploader_id = u.id
        LEFT JOIN ratings r ON p.id = r.paper_id
        WHERE p.id = ?
        GROUP BY p.id
    '''
    
    c.execute(query, (paper_id,))
    paper = c.fetchone()
    conn.close()
    
    if not paper:
        return jsonify({'error': 'Paper not found'}), 404
    
    return jsonify({
        'id': paper[0],
        'title': paper[1],
        'department': paper[2],
        'semester': paper[3],
        'subject': paper[4],
        'year': paper[5],
        'exam_type': paper[6],
        'file_path': paper[7],  # Include file_path in the response
        'file_size': paper[8],
        'pages': paper[9],
        'upload_date': paper[11],
        'description': paper[12],
        'uploader_name': paper[13],
        'avg_rating': round(paper[14], 1) if paper[14] else 0,
        'rating_count': paper[15]
    })

@app.route('/api/papers/<int:paper_id>', methods=['DELETE'])
def delete_paper(paper_id):
    # Check if user is admin
    if session.get('role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    conn = sqlite3.connect('university_papers.db')
    c = conn.cursor()
    
    # Get the file path before deleting
    c.execute('SELECT file_path FROM papers WHERE id = ?', (paper_id,))
    result = c.fetchone()
    
    if not result:
        conn.close()
        return jsonify({'success': False, 'message': 'Paper not found'}), 404
    
    file_path = result[0]
    
    # Delete the paper from database
    c.execute('DELETE FROM papers WHERE id = ?', (paper_id,))
    conn.commit()
    conn.close()
    
    # Delete the file from uploads folder
    try:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], file_path))
    except Exception as e:
        # Log the error but continue
        print(f"Error deleting file: {e}")
    
    return jsonify({'success': True, 'message': 'Paper deleted successfully'})

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

@app.route('/api/admin/recent-papers')
def admin_recent_papers():
    # Check if user is admin
    if session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    conn = sqlite3.connect('university_papers.db')
    c = conn.cursor()
    
    query = '''
        SELECT p.*, u.username as uploader_name
        FROM papers p
        LEFT JOIN users u ON p.uploader_id = u.id
        ORDER BY p.upload_date DESC
        LIMIT 20
    '''
    
    c.execute(query)
    papers = c.fetchall()
    conn.close()
    
    papers_list = []
    for paper in papers:
        papers_list.append({
            'id': paper[0],
            'title': paper[1],
            'department': paper[2],
            'semester': paper[3],
            'subject': paper[4],
            'year': paper[5],
            'exam_type': paper[6],
            'file_path': paper[7],
            'file_size': paper[8],
            'pages': paper[9],
            'upload_date': paper[11],
            'description': paper[12],
            'uploader_name': paper[13]
        })
    
    return jsonify(papers_list)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)