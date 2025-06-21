# Uploads Directory

This directory contains uploaded PDF files for the University Papers Portal.

## Structure
- PDF files are stored with unique filenames to prevent conflicts
- Files are organized by upload date and paper ID
- Maximum file size: 16MB
- Supported format: PDF only

## Security
- All uploaded files are validated for type and size
- Files are served through the Flask application with proper headers
- Direct access to files is controlled by the application

## Backup
- Regular backups of this directory should be maintained
- Consider cloud storage integration for production use