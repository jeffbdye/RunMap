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
            steps {
                echo 'Setting up secrets...'
                writeFile file: './src/appsettings.secrets.ts', text: "export const ps = '${env.MAPBOX_KEY}';"
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
