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
            environment {
                MAPBOX_KEY="${env.MAPBOX_KEY}"
            }
            steps {
                echo 'Setting up secrets...'
                sh 'sh sh/secrets.sh $MAPBOX_KEY'
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
