pipeline {
    agent any
    stages {
        stage('Checkout Code') {
            steps {
                cleanWs()
                checkout scm
            }
        }
        stage('Backend Build (.NET)') {
            steps {
                sh '''
                docker run --rm \
                -v $PWD/backend:/app \
                -w /app \
                mcr.microsoft.com/dotnet/sdk:9.0 \
                bash -c "dotnet --version && dotnet restore && dotnet build --configuration Release"
                '''
            }
        }
        stage('Frontend Build (Node.js)') {
            steps {
                sh '''
                docker run --rm \
                -v $PWD/frontend:/app \
                -w /app \
                node:20 \
                bash -c "node --version && npm install && npm run build"
                '''
            }
        }
    }
    post {
        success {
            echo 'CI Pipeline SUCCESS 🎉'
        }
        failure {
            echo 'CI Pipeline FAILED ❌'
        }
    }
}