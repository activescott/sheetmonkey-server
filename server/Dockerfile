FROM openjdk
# To install sudo?  - https://stackoverflow.com/questions/25845538/how-to-use-sudo-inside-a-docker-container
RUN apt-get update && \
      apt-get -y install sudo netcat
RUN adduser --disabled-password --gecos '' docker
RUN adduser docker sudo
RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
USER docker

# Install node: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions
RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN sudo apt-get install -y nodejs

# Install yarn https://yarnpkg.com/lang/en/docs/install/#debian-stable
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
RUN sudo apt-get update && sudo apt-get install yarn

COPY ./ /usr/src/myapp
WORKDIR /usr/src/myapp

RUN sudo chown -R docker:docker ./
RUN chmod 755 ./

RUN yarn

CMD ["yarn", "test"]
