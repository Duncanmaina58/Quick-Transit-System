pipeline {
    agent any
    options {
        skipDefaultCheckout(false)
    }
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }
        stage('Backend Build (.NET)') {
            steps {
                sh 'ls -la backend/'
                sh 'docker run --rm -v $(pwd)/backend:/app -w /app mcr.microsoft.com/dotnet/sdk:9.0 dotnet restore'
                sh 'docker run --rm -v $(pwd)/backend:/app -w /app mcr.microsoft.com/dotnet/sdk:9.0 dotnet build --configuration Release'
            }
        }
        stage('Frontend Build (Node.js)') {
            steps {
                sh 'ls -la frontend/'
                sh 'docker run --rm -v $(pwd)/frontend:/app -w /app node:20 npm install'
                sh 'docker run --rm -v $(pwd)/frontend:/app -w /app node:20 npm run build'
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