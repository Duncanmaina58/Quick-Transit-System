pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build (.NET)') {
            steps {
                script {
                    docker.image('mcr.microsoft.com/dotnet/sdk:8.0').inside {
                        dir('Backend') {
                            sh 'dotnet --version'
                            sh 'dotnet restore'
                            sh 'dotnet build --configuration Release'
                        }
                    }
                }
            }
        }

        stage('Frontend Build (Node.js)') {
            steps {
                script {
                    docker.image('node:20').inside {
                        dir('Frontend') {
                            sh 'node --version'
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
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