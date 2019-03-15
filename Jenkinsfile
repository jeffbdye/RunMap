pipeline {    
    agent any
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
            withCredentials([file(credentialsId: 'MAPBOX_SECRET', variable: 'MAPBOX_SECRET')]) {
                steps {
                    echo 'Setting up secrets...'
                    sh 'cp $MAPBOX_SECRET ./src/appsettings.secrets.ts';
                }
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
                sh 'sh sh/deploy.sh'
            }
        }
    }
}
