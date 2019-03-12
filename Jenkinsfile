pipeline {    
    agent any
    environment {
        mapbox_key = credentials('mapbox_key')
    }
    stages {
        stage('Install') {
            steps {
                echo 'Building...'
                sh 'npm install'
            }
        }
        stage('Test') {
           steps {
               echo 'Testing...'
               sh 'npm run build:test'
               sh 'npm run test'
           }
        }
        stage('Secrets') {
            steps {
                echo 'Setting up secrets...'
                sh 'bash sh/secrets.sh'
            }
        }
        stage('Bundle') {
            steps {
                echo 'Bundling...'
                sh 'npm run build:deploy'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying...'
                sh 'bash sh/deploy.sh'
            }
        }
    }
}
