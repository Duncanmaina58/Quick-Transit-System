pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build') {
            steps {
                dir('Backend') {
                    sh 'dotnet --version'
                    sh 'dotnet restore'
                    sh 'dotnet build --configuration Release'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('Frontend') {
                    sh 'npm --version'
                    sh 'npm install'
                    sh 'npm run build'
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