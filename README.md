# University Papers Portal

A responsive web application for storing and accessing university/college question papers and lab practicals. Built with Flask (Python) backend and HTML/CSS/JavaScript frontend.

## Features

### For Students
- **Browse Papers**: Filter by department, semester, subject, year, and exam type
- **Search**: Keyword-based search across all papers
- **Preview**: In-browser PDF preview with zoom and navigation
- **Rate & Review**: Rate papers and leave comments (requires login)
- **Download**: Download papers for offline access
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### For Administrators
- **Upload Papers**: Add new question papers and lab practicals
- **Manage Content**: Edit or delete existing papers
- **User Management**: View and manage user accounts
- **Analytics**: View platform statistics and usage data

### Technical Features
- **User Authentication**: Secure login/registration system
- **Role-based Access**: Different permissions for students and admins
- **File Validation**: PDF-only uploads with size limits
- **Database**: SQLite database for easy setup and portability
- **Modern UI**: Bootstrap-based responsive interface
- **Security**: Input validation and secure file handling

## Technology Stack

### Backend
- **Python 3.7+**
- **Flask**: Web framework
- **SQLite**: Database
- **Werkzeug**: Password hashing and file handling
- **PyPDF2**: PDF processing

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox/Grid
- **JavaScript (ES6+)**: Interactive functionality
- **Bootstrap 5**: Responsive framework
- **Font Awesome**: Icons

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Setup Instructions

1. **Clone or Download the Project**
   ```bash
   # If using git
   git clone <repository-url>
   cd NewProject
   
   # Or download and extract the ZIP file
   ```

2. **Create Virtual Environment** (Recommended)
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize Database**
   ```bash
   python app.py
   ```
   The database will be created automatically on first run.

5. **Run the Application**
   ```bash
   python app.py
   ```
   The application will be available at `http://localhost:5000`

## Usage

### First Time Setup

1. **Access the Application**
   - Open your web browser and go to `http://localhost:5000`

2. **Create Admin Account**
   - Register a new account
   - The first registered user automatically becomes an admin
   - Or use the demo admin account: `admin` / `admin123`

3. **Upload Sample Papers**
   - Login as admin
   - Go to "Upload Paper" in the dashboard
   - Upload some sample PDF files to test the system

### For Students

1. **Register/Login**
   - Create a new account or use demo account: `student` / `student123`

2. **Browse Papers**
   - Use filters to find specific papers
   - Search by keywords
   - Click on papers to preview

3. **Rate and Comment**
   - Login required for rating and commenting
   - Help other students by providing feedback

### For Administrators

1. **Upload Papers**
   - Navigate to Dashboard → Upload Paper
   - Fill in paper details and upload PDF
   - Papers are immediately available to students

2. **Manage Content**
   - View all papers in the admin dashboard
   - Edit paper information
   - Delete inappropriate content

3. **Monitor Usage**
   - View platform statistics
   - Monitor user activity
   - Manage user accounts

## File Structure

```
NewProject/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── database.db           # SQLite database (created automatically)
├── static/               # Static files
│   ├── css/
│   │   └── style.css     # Custom styles
│   └── js/
│       └── main.js       # JavaScript functionality
├── templates/            # HTML templates
│   ├── base.html         # Base template
│   ├── index.html        # Home page
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── dashboard.html    # User dashboard
|   ├──request_upload.html #user uplode
|   ├──upload_request.html #admin choice for approving or rejecting student request
│   └── upload.html       # Paper upload page
└── uploads/              # Uploaded PDF files
    └── README.md         # Upload directory info
```

## Configuration

### Environment Variables
You can set these environment variables to customize the application:

- `SECRET_KEY`: Flask secret key (default: auto-generated)
- `DATABASE_URL`: Database connection string (default: SQLite)
- `UPLOAD_FOLDER`: Upload directory path (default: ./uploads)
- `MAX_CONTENT_LENGTH`: Maximum file size in bytes (default: 16MB)

### Application Settings
Edit `app.py` to modify:

- File upload limits
- Allowed file types
- Database configuration
- Security settings

## API Endpoints

The application provides several API endpoints for dynamic content:

- `GET /api/papers` - Get papers with filters
- `GET /api/papers/<id>` - Get specific paper details
- `GET /api/filters` - Get available filter options
- `POST /api/rate-paper` - Submit paper rating
- `POST /api/add-comment` - Add comment to paper
- `GET /api/comments/<paper_id>` - Get paper comments
- `GET /api/download/<paper_id>` - Download paper file

## Security Features

- **Password Hashing**: Secure password storage using Werkzeug
- **File Validation**: Only PDF files allowed, size limits enforced
- **Input Sanitization**: All user inputs are validated and sanitized
- **Session Management**: Secure session handling
- **CSRF Protection**: Built-in Flask security features
- **SQL Injection Prevention**: Parameterized queries

## Troubleshooting

### Common Issues

1. **Database Errors**
   - Delete `database.db` and restart the application
   - Check file permissions in the project directory

2. **File Upload Issues**
   - Ensure the `uploads` directory exists and is writable
   - Check file size limits (default: 16MB)
   - Verify PDF file format

3. **Port Already in Use**
   - Change the port in `app.py`: `app.run(port=5001)`
   - Or kill the process using port 5000

4. **Static Files Not Loading**
   - Check that `static` directory exists
   - Verify file paths in templates
   - Clear browser cache

### Debug Mode
To enable debug mode for development:

```python
# In app.py
app.run(debug=True)
```

**Warning**: Never enable debug mode in production!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines

- Follow PEP 8 for Python code
- Use semantic HTML
- Write responsive CSS
- Add comments for complex logic
- Test on multiple browsers

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

## Future Enhancements

- **Cloud Storage**: Integration with AWS S3 or Google Cloud
- **Advanced Search**: Full-text search within PDF content
- **Notifications**: Email notifications for new papers
- **Mobile App**: Native mobile applications
- **Analytics**: Detailed usage analytics and reporting
- **Bulk Upload**: Upload multiple papers at once
- **Categories**: Additional categorization options
- **Bookmarks**: Save favorite papers
- **Social Features**: User profiles and following

## Demo Accounts

For testing purposes, the following demo accounts are available:

### Student Account
- **Username**: `student`
- **Password**: `student123`
- **Permissions**: Browse, search, rate, and comment

**Note**: These accounts are created automatically when the application starts.

---

**Happy Learning! 📚**
